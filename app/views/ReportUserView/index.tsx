import React, { useLayoutEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { CompositeNavigationProp, RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import log from '../../lib/methods/helpers/log';
import SafeAreaView from '../../containers/SafeAreaView';
import { useTheme } from '../../theme';
import { ChatsStackParamList } from '../../stacks/types';
import { MasterDetailInsideStackParamList } from '../../stacks/MasterDetailStack/types';
import I18n from '../../i18n';
import UserAvatarAndName from './UserAvatarAndName';
import styles from './styles';
import { ControlledFormTextInput } from '../../containers/TextInput';
import Button from '../../containers/Button';
import { useAppSelector } from '../../lib/hooks';
import EventEmitter from '../../lib/methods/helpers/events';
import { LISTENER } from '../../containers/Toast';
import { Services } from '../../lib/services';

type TReportUserViewNavigationProp = CompositeNavigationProp<
	StackNavigationProp<ChatsStackParamList, 'ReportUserView'>,
	StackNavigationProp<MasterDetailInsideStackParamList>
>;

type TReportUserViewRouteProp = RouteProp<ChatsStackParamList, 'ReportUserView'>;

interface ISubmit {
	description: string;
}

const schema = yup.object().shape({
	description: yup.string().trim().required()
});

const ReportUserView = () => {
	const [loading, setLoading] = useState(false);
	const { colors } = useTheme();
	const navigation = useNavigation<TReportUserViewNavigationProp>();
	const { isMasterDetail } = useAppSelector(state => ({ isMasterDetail: state.app.isMasterDetail }));

	const {
		params: { username, rid, userId, name }
	} = useRoute<TReportUserViewRouteProp>();

	const {
		control,
		handleSubmit,
		formState: { isValid }
	} = useForm<ISubmit>({ mode: 'onChange', resolver: yupResolver(schema), defaultValues: { description: '' } });

	useLayoutEffect(() => {
		navigation?.setOptions({
			title: I18n.t('Report_user')
		});
	}, [navigation]);

	const submit = async ({ description }: ISubmit) => {
		try {
			setLoading(true);
			await Services.reportUser(userId, description);
			EventEmitter.emit(LISTENER, { message: I18n.t('Report_sent_successfully') });
			setLoading(false);
			if (isMasterDetail) {
				navigation.navigate('DrawerNavigator');
				return;
			}
			navigation.navigate('RoomView');
		} catch (e) {
			log(e);
			setLoading(false);
		}
	};

	return (
		<>
			<StatusBar />
			<SafeAreaView style={[styles.containerView, { backgroundColor: colors.auxiliaryBackground }]} testID='report-user-view'>
				<UserAvatarAndName username={username} rid={rid} name={name} />
				<ControlledFormTextInput
					name='description'
					control={control}
					label={I18n.t('Why_do_you_want_to_report')}
					onSubmitEditing={handleSubmit(submit)}
					returnKeyType='send'
					multiline
					inputStyle={styles.textInput}
					labelStyle={[styles.labelTextInput, { color: colors.fontDefault }]}
				/>
				<Button
					title={I18n.t('Report')}
					type='primary'
					backgroundColor={colors.dangerColor}
					disabled={!isValid}
					onPress={handleSubmit(submit)}
					testID='profile-view-delete-my-account'
					loading={loading}
				/>
			</SafeAreaView>
		</>
	);
};

export default ReportUserView;
