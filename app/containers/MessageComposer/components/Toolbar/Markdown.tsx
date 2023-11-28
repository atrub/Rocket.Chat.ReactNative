import React, { ReactElement } from 'react';

import { BaseButton } from '..';
import { useMessageComposerApi } from '../../context';
import { Gap } from '../Gap';
import { TMarkdownStyle } from '../../interfaces';
import { emitter } from '../../emitter';
import { AnimatedToolbar } from './AnimatedToolbar';

export const Markdown = (): ReactElement => {
	const { setMarkdownToolbar } = useMessageComposerApi();

	const onPress = (style: TMarkdownStyle) => emitter.emit('addMarkdown', { style });

	return (
		<AnimatedToolbar key='markdown'>
			<BaseButton
				onPress={() => setMarkdownToolbar(false)}
				testID='message-composer-close-markdown'
				accessibilityLabel='TBD'
				icon='close'
			/>
			<Gap />
			<BaseButton onPress={() => onPress('bold')} testID='message-composer-bold' accessibilityLabel='TBD' icon='bold' />
			<Gap />
			<BaseButton onPress={() => onPress('italic')} testID='message-composer-italic' accessibilityLabel='TBD' icon='italic' />
			<Gap />
			<BaseButton onPress={() => onPress('strike')} testID='message-composer-strike' accessibilityLabel='TBD' icon='strike' />
			<Gap />
			<BaseButton onPress={() => onPress('code')} testID='message-composer-code' accessibilityLabel='TBD' icon='code' />
			<Gap />
			<BaseButton
				onPress={() => onPress('code-block')}
				testID='message-composer-code-block'
				accessibilityLabel='TBD'
				icon='code-block'
			/>
		</AnimatedToolbar>
	);
};