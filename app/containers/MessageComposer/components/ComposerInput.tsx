import React, { forwardRef, memo, useEffect, useImperativeHandle } from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useDebouncedCallback } from 'use-debounce';
import { useDispatch } from 'react-redux';

import { IAutocompleteItemProps, IComposerInput, IComposerInputProps, IInputSelection, TSetInput } from '../interfaces';
import { useAutocompleteParams, useFocused, useMessageComposerApi } from '../context';
import { loadDraftMessage, saveDraftMessage, fetchIsAllOrHere } from '../helpers';
import { useSubscription } from '../hooks';
import sharedStyles from '../../../views/Styles';
import { useTheme } from '../../../theme';
import { userTyping } from '../../../actions/room';
import { getRoomTitle } from '../../../lib/methods/helpers';
import { MIN_HEIGHT, NO_CANNED_RESPONSES, markdownStyle } from '../constants';
import database from '../../../lib/database';
import Navigation from '../../../lib/navigation/appNavigation';
import { emitter } from '../emitter';
import { useRoomContext } from '../../../views/RoomView/context';
import { getMessageById } from '../../../lib/database/services/Message';
import { generateTriggerId } from '../../../lib/methods';
import getMentionRegexp from '../../MessageBox/getMentionRegexp';
import { Services } from '../../../lib/services';
import log from '../../../lib/methods/helpers/log';
import { useAppSelector } from '../../../lib/hooks';

const styles = StyleSheet.create({
	textInput: {
		flex: 1,
		minHeight: MIN_HEIGHT,
		maxHeight: 200,
		paddingTop: 12,
		// TODO: check glitch on iOS selector pin with several lines
		paddingBottom: 12,
		fontSize: 16,
		textAlignVertical: 'center',
		...sharedStyles.textRegular,
		lineHeight: 22
	}
});

const defaultSelection: IInputSelection = { start: 0, end: 0 };

export const ComposerInput = memo(
	forwardRef<IComposerInput, IComposerInputProps>(({ inputRef }, ref) => {
		console.count('[MessageComposer] ComposerInput');
		const { colors, theme } = useTheme();
		const { rid, tmid, sharing, action, selectedMessages } = useRoomContext();
		const focused = useFocused();
		const { setFocused, setTrackingViewHeight, setMicOrSend, setAutocompleteParams } = useMessageComposerApi();
		const autocompleteType = useAutocompleteParams()?.type;
		const textRef = React.useRef('');
		const selectionRef = React.useRef<IInputSelection>(defaultSelection);
		const dispatch = useDispatch();
		const subscription = useSubscription(rid);
		const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);
		// TODO: i18n
		let placeholder = tmid ? 'Add thread reply' : 'Message ';
		if (subscription && !tmid) {
			placeholder += subscription.t === 'd' ? '@' : '#';
			placeholder += getRoomTitle(subscription);
		}

		useEffect(() => {
			const setDraftMessage = async () => {
				const draftMessage = await loadDraftMessage({ rid, tmid });
				setInput(draftMessage);
			};
			if (action !== 'edit') {
				setDraftMessage();
			}

			return () => {
				if (action !== 'edit') {
					saveDraftMessage({ rid, tmid, draftMessage: textRef.current });
				}
			};
		}, [action, rid, tmid]);

		useEffect(() => {
			const fetchMessageAndSetInput = async () => {
				const message = await getMessageById(selectedMessages[0]);
				if (message) {
					setInput(message?.msg || '');
				}
			};

			if (action === 'edit' && selectedMessages[0]) {
				focus();
				fetchMessageAndSetInput();
			}
		}, [action, selectedMessages]);

		useEffect(() => {
			emitter.on('addMarkdown', ({ style }) => {
				const { start, end } = selectionRef.current;
				const text = textRef.current;
				const markdown = markdownStyle[style];
				const newText = `${text.substr(0, start)}${markdown}${text.substr(start, end - start)}${markdown}${text.substr(end)}`;
				setInput(newText, {
					start: start + markdown.length,
					end: start === end ? start + markdown.length : end + markdown.length
				});
			});
			emitter.on('toolbarMention', () => {
				if (autocompleteType) {
					return;
				}
				const { start, end } = selectionRef.current;
				const text = textRef.current;
				const newText = `${text.substr(0, start)}@${text.substr(start, end - start)}${text.substr(end)}`;
				setInput(newText, { start: start + 1, end: start === end ? start + 1 : end + 1 });
				setAutocompleteParams({ text: '', type: '@' });
			});
			return () => {
				emitter.off('addMarkdown');
				emitter.off('toolbarMention');
			};
		}, [rid, autocompleteType]);

		useImperativeHandle(ref, () => ({
			getTextAndClear: () => {
				const text = textRef.current;
				setInput('');
				return text;
			},
			getText: () => textRef.current,
			getSelection: () => selectionRef.current,
			setInput,
			onAutocompleteItemSelected
		}));

		const setInput: TSetInput = (text, selection) => {
			textRef.current = text;
			if (inputRef.current) {
				inputRef.current.setNativeProps({ text });
			}
			if (selection) {
				selectionRef.current = selection;
				inputRef.current?.setSelection?.(selection.start, selection.end);
			}
			setMicOrSend(text.length === 0 ? 'mic' : 'send');
		};

		const focus = () => {
			if (inputRef.current) {
				inputRef.current.focus();
			}
		};

		const onChangeText: TextInputProps['onChangeText'] = text => {
			// const isTextEmpty = text.length === 0;
			// setMicOrSend(!isTextEmpty ? 'send' : 'mic');
			debouncedOnChangeText(text);
			setInput(text);
		};

		const onSelectionChange: TextInputProps['onSelectionChange'] = e => {
			selectionRef.current = e.nativeEvent.selection;
		};

		const onFocus: TextInputProps['onFocus'] = () => {
			setFocused(true);
		};

		const onBlur: TextInputProps['onBlur'] = () => {
			setFocused(false);
		};

		const handleLayout: TextInputProps['onLayout'] = e => {
			setTrackingViewHeight(e.nativeEvent.layout.height);
		};

		const onAutocompleteItemSelected: IAutocompleteItemProps['onPress'] = async item => {
			if (item.type === 'loading') {
				return null;
			}

			// If it's slash command preview, we need to execute the command
			if (item.type === '/preview') {
				try {
					const db = database.active;
					const commandsCollection = db.get('slash_commands');
					const commandRecord = await commandsCollection.find(item.text);
					const { appId } = commandRecord;
					const triggerId = generateTriggerId(appId);
					Services.executeCommandPreview(item.text, item.params, rid, item.preview, triggerId, tmid);
				} catch (e) {
					log(e);
				}
				requestAnimationFrame(() => {
					stopAutocomplete();
					setInput('', { start: 0, end: 0 });
				});
				return;
			}

			// If it's canned response, but there's no canned responses, we open the canned responses view
			if (item.type === '!' && item.id === NO_CANNED_RESPONSES) {
				const params = { rid };
				if (isMasterDetail) {
					Navigation.navigate('ModalStackNavigator', { screen: 'CannedResponsesListView', params });
				} else {
					Navigation.navigate('CannedResponsesListView', params);
				}
				stopAutocomplete();
				return;
			}

			const text = textRef.current;
			const { start, end } = selectionRef.current;
			const cursor = Math.max(start, end);
			const regexp = getMentionRegexp();
			let result = text.substr(0, cursor).replace(regexp, '');
			// Remove the ! after select the canned response
			if (item.type === '!') {
				const lastIndexOfExclamation = text.lastIndexOf('!', cursor);
				result = text.substr(0, lastIndexOfExclamation).replace(regexp, '');
			}
			let mention = '';
			switch (item.type) {
				case '@':
					mention = fetchIsAllOrHere(item) ? item.title : item.subtitle || item.title;
					break;
				case '#':
					mention = item.subtitle ? item.subtitle : '';
					break;
				case ':':
					mention = `${typeof item.emoji === 'string' ? item.emoji : item.emoji.name}:`;
					break;
				case '/':
					mention = item.title;
					break;
				case '!':
					mention = item.subtitle ? item.subtitle : '';
					break;
				default:
					mention = '';
			}
			const newText = `${result}${mention} ${text.slice(cursor)}`;

			const newCursor = cursor + mention.length;
			setInput(newText, { start: newCursor, end: newCursor });
			focus();
			requestAnimationFrame(() => {
				stopAutocomplete();
			});
		};

		const stopAutocomplete = () => {
			setAutocompleteParams({ text: '', type: null, params: '' });
		};

		const debouncedOnChangeText = useDebouncedCallback(async (text: string) => {
			const isTextEmpty = text.length === 0;
			handleTyping(!isTextEmpty);
			if (isTextEmpty || !focused) {
				stopAutocomplete();
				return;
			}
			const { start, end } = selectionRef.current;
			const cursor = Math.max(start, end);
			const whiteSpaceOrBreakLineRegex = /[\s\n]+/;
			const txt =
				cursor < text.length ? text.substr(0, cursor).split(whiteSpaceOrBreakLineRegex) : text.split(whiteSpaceOrBreakLineRegex);
			const lastWord = txt[txt.length - 1];
			const autocompleteText = lastWord.substring(1);

			if (!lastWord) {
				stopAutocomplete();
				return;
			}
			if (text.match(/^\//)) {
				const commandParameter = text.match(/^\/([a-z0-9._-]+) (.+)/im);
				if (commandParameter) {
					const db = database.active;
					const [, command, params] = commandParameter;
					const commandsCollection = db.get('slash_commands');
					try {
						const commandRecord = await commandsCollection.find(command);
						if (commandRecord.providesPreview) {
							setAutocompleteParams({ params, text: command, type: '/preview' });
							return;
						}
					} catch (e) {
						// do nothing
					}
				}
				setAutocompleteParams({ text: autocompleteText, type: '/' });
				return;
			}
			if (lastWord.match(/^#/)) {
				setAutocompleteParams({ text: autocompleteText, type: '#' });
				return;
			}
			if (lastWord.match(/^@/)) {
				setAutocompleteParams({ text: autocompleteText, type: '@' });
				return;
			}
			if (lastWord.match(/^:/)) {
				setAutocompleteParams({ text: autocompleteText, type: ':' });
				return;
			}
			if (lastWord.match(/^!/) && subscription?.t === 'l') {
				setAutocompleteParams({ text: autocompleteText, type: '!' });
				return;
			}

			stopAutocomplete();
		}, 300); // TODO: 300ms?

		const handleTyping = (isTyping: boolean) => {
			if (sharing) {
				return;
			}
			dispatch(userTyping(rid, isTyping));
		};

		return (
			<TextInput
				onLayout={handleLayout}
				style={[styles.textInput, { color: colors.fontDefault }]}
				placeholder={placeholder}
				placeholderTextColor={colors.fontAnnotation}
				ref={component => (inputRef.current = component)}
				blurOnSubmit={false}
				onChangeText={onChangeText}
				onSelectionChange={onSelectionChange}
				onFocus={onFocus}
				onBlur={onBlur}
				underlineColorAndroid='transparent'
				defaultValue=''
				multiline
				keyboardAppearance={theme === 'light' ? 'light' : 'dark'}
				testID={`message-composer-input${tmid ? '-thread' : ''}`}
			/>
		);
	})
);
