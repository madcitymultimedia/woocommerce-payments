/**
 * External dependencies
 */
import React, { useContext } from 'react';
import { __ } from '@wordpress/i18n';
import {
	Card,
	CheckboxControl,
	ExternalLink,
	TextControl,
	Notice,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import WCPaySettingsContext from '../wcpay-settings-context';
import CardBody from '../card-body';
import {
	useAccountStatementDescriptor,
	useManualCapture,
	useGetSavingError,
} from '../../data';
import './style.scss';

const ACCOUNT_STATEMENT_MAX_LENGTH = 22;

const TransactionsAndDeposits = () => {
	const {
		accountStatus: { accountLink },
	} = useContext( WCPaySettingsContext );
	const [
		isManualCaptureEnabled,
		setIsManualCaptureEnabled,
	] = useManualCapture();
	const [
		accountStatementDescriptor,
		setAccountStatementDescriptor,
	] = useAccountStatementDescriptor();
	const customerBankStatementErrorMessage = useGetSavingError()?.data?.details
		?.account_statement_descriptor?.message;

	return (
		<Card className="transactions-and-deposits">
			<CardBody>
				<h4>
					{ __( 'Transaction preferences', 'woocommerce-payments' ) }
				</h4>
				<CheckboxControl
					checked={ isManualCaptureEnabled }
					onChange={ setIsManualCaptureEnabled }
					label={ __(
						'Issue an authorization on checkout, and capture later',
						'woocommerce-payments'
					) }
					help={ __(
						'Charge must be captured on the order details screen within 7 days of authorization, ' +
							'otherwise the authorization and order will be canceled.',
						'woocommerce-payments'
					) }
				/>
				{ customerBankStatementErrorMessage && (
					<Notice status="error" isDismissible={ false }>
						<span
							dangerouslySetInnerHTML={ {
								__html: customerBankStatementErrorMessage,
							} }
						/>
					</Notice>
				) }
				<div className="transactions-and-deposits__account-statement-wrapper">
					<TextControl
						className="transactions-and-deposits__account-statement-input"
						help={ __(
							"Edit the way your store name appears on your customers' bank statements.",
							'woocommerce-payments'
						) }
						label={ __(
							'Customer bank statement',
							'woocommerce-payments'
						) }
						value={ accountStatementDescriptor }
						onChange={ setAccountStatementDescriptor }
						maxLength={ ACCOUNT_STATEMENT_MAX_LENGTH }
					/>
					<span className="input-help-text" aria-hidden="true">
						{ `${ accountStatementDescriptor.length } / ${ ACCOUNT_STATEMENT_MAX_LENGTH }` }
					</span>
				</div>
				<div className="transactions-and-deposits__bank-information">
					<h4>
						{ __(
							'Bank account information',
							'woocommerce-payments'
						) }
					</h4>
					<p className="transactions-and-deposits__bank-information-help">
						{ __(
							'Manage and update your deposit account information to receive payments and payouts.',
							'woocommerce-payments'
						) }{ ' ' }
						<ExternalLink href={ accountLink }>
							{ __( 'Manage in Stripe', 'woocommerce-payments' ) }
						</ExternalLink>
					</p>
				</div>
			</CardBody>
		</Card>
	);
};

export default TransactionsAndDeposits;
