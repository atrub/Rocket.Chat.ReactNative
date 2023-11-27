import React, { useLayoutEffect } from 'react';
import { StatusBar } from 'react-native';
import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import SafeAreaView from '../../containers/SafeAreaView';
import { useTheme } from '../../theme';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import I18n from '../../i18n';
import UserAvatarAndName from './UserAvatarAndName';
import styles from './styles';

type TReportUserViewNavigationProp = CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'ReportUserView'>,
	StackNavigationProp<MasterDetailInsideStackParamList>
>;

type TReportUserViewRouteProp = RouteProp<ChatsStackParamList, 'ReportUserView'>;

const ReportUserView = () => {
	const {
		params: { username, rid, userId, name }
	} = useRoute<TReportUserViewRouteProp>();
	console.log('🚀 ~ file: index.tsx:23 ~ ReportUserView ~ { username, rid, userId, name }:', { username, rid, userId, name });
	const { colors } = useTheme();
	const navigation = useNavigation<TReportUserViewNavigationProp>();

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: I18n.t('Report_user')
		});
	}, [navigation]);

	return (
		<>
			<StatusBar />
			<SafeAreaView style={[styles.containerView, { backgroundColor: colors.auxiliaryBackground }]} testID='report-user-view'>
				<UserAvatarAndName username={username} rid={rid} name={name} />
			</SafeAreaView>
		</>
	);
};

export default ReportUserView;
