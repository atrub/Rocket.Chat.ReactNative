import React from 'react';
import { StyleProp, Text, TextStyle, View } from 'react-native';

import { themes } from '../../lib/constants';
import { useTheme } from '../../theme';
import { IUserChannel } from './interfaces';
import styles from './styles';
import { getSubscriptionByRoomId } from '../../lib/database/services/Subscription';
import { useAppSelector } from '../../lib/hooks';
import { goRoom } from '../../lib/methods/helpers/goRoom';

interface IHashtag {
	hashtag: string;
	navToRoomInfo?: Function;
	style?: StyleProp<TextStyle>[];
	channels?: IUserChannel[];
}

const Hashtag = React.memo(({ hashtag, channels, navToRoomInfo, style = [] }: IHashtag) => {
	const { theme } = useTheme();
	const isMasterDetail = useAppSelector(state => state.app.isMasterDetail);

	const handlePress = async () => {
		const index = channels?.findIndex(channel => channel.name === hashtag);
		if (typeof index !== 'undefined' && navToRoomInfo) {
			const navParam = {
				t: 'c',
				rid: channels?.[index]._id
			};
			const room = navParam.rid && (await getSubscriptionByRoomId(navParam.rid));
			if (room) {
				goRoom({ item: room, isMasterDetail });
			} else {
				navToRoomInfo(navParam);
			}
		}
	};

	if (channels && channels.length && channels.findIndex(channel => channel.name === hashtag) !== -1) {
		return (
			<View style={styles.mentionView}>
				<Text>
					<View>
						<Text style={[styles.plainText, styles.text, { color: themes[theme].bodyText, marginBottom: -4 }]}>@</Text>
					</View>
					<View>
						<Text
							style={[
								styles.mention,
								{
									color: themes[theme].mentionOthersColor,
									backgroundColor: themes[theme].mentionOthersBackground
								},
								...style
							]}
							onPress={handlePress}
						>
							{` ${hashtag} `}
						</Text>
					</View>
				</Text>
			</View>
		);
	}
	return <Text style={[styles.text, { color: themes[theme].bodyText }, ...style]}>{`#${hashtag}`}</Text>;
});

export default Hashtag;
