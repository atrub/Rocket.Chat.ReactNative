import { View } from 'react-native';
import React, { ReactElement } from 'react';
import { BorderlessButton } from 'react-native-gesture-handler';

import { useTheme } from '../../../../theme';
import { CustomIcon } from '../../../CustomIcon';
import { hitSlop } from '../Buttons';

export const ReviewButton = ({ onPress }: { onPress: Function }): ReactElement => {
	const { colors } = useTheme();
	return (
		<BorderlessButton
			style={{
				alignItems: 'center',
				justifyContent: 'center',
				width: 32,
				height: 32,
				borderRadius: 16,
				backgroundColor: colors.buttonBackgroundPrimaryDefault
			}}
			onPress={() => onPress()}
			testID={'tbd'}
			hitSlop={hitSlop}
		>
			<View accessible accessibilityLabel={'tbd'} accessibilityRole='button'>
				<CustomIcon name={'arrow-right'} size={24} color={colors.fontWhite} />
			</View>
		</BorderlessButton>
	);
};
