/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import { Card, CardBody } from '@wordpress/components';
import { getAdminUrl } from 'wcpay/utils';

/**
 * Internal dependencies
 */
import PaymentDetailsSummary from './summary';
import PaymentDetailsTimeline from './timeline';
import PaymentDetailsPaymentMethod from './payment-method';
import Page from 'components/page';
import ErrorBoundary from 'components/error-boundary';
import { TestModeNotice, topics } from 'components/test-mode-notice';
import PaymentCardReaderChargeDetails from './readers';
import {
	PaymentChargeDetailsResponse,
	isPaymentIntent,
	isCharge,
	PaymentDetailsProps,
	PaymentChargeDetailsProps,
} from './types';
import { Charge } from '../types/charges';
import {
	getIsChargeId,
	usePaymentIntentWithChargeFallback,
} from 'wcpay/data/payment-intents';
import { useLatestFraudOutcome } from '../data/fraud-outcomes';
import { PaymentIntent } from '../types/payment-intents';

const PaymentChargeDetails: React.FC< PaymentChargeDetailsProps > = ( {
	id,
} ) => {
	const {
		data,
		error,
		isLoading: isLoadingData,
	} = usePaymentIntentWithChargeFallback(
		id
	) as PaymentChargeDetailsResponse;

	const paymentIntent = isPaymentIntent( data )
		? data
		: ( {} as PaymentIntent );

	const orderId = paymentIntent?.metadata?.order_id;

	const {
		data: fraudOutcome,
		isLoading: isLoadingFraudOutcome,
	} = useLatestFraudOutcome( orderId );

	const isChargeId = getIsChargeId( id );
	const isLoading = isChargeId || isLoadingData || isLoadingFraudOutcome;

	const testModeNotice = <TestModeNotice topic={ topics.paymentDetails } />;

	const charge =
		( isPaymentIntent( data ) ? data.charge : data ) || ( {} as Charge );
	const metadata = isPaymentIntent( data ) ? data.metadata : {};

	useEffect( () => {
		if ( ! isCharge( data ) ) {
			return;
		}

		const shouldRedirect = !! ( isChargeId && data.payment_intent );

		if ( shouldRedirect ) {
			const url = getAdminUrl( {
				page: 'wc-admin',
				path: '/payments/transactions/details',
				id: data.payment_intent,
			} );

			window.location.href = url;
		}
	}, [ data, isChargeId ] );

	// Check instance of error because its default value is empty object
	if ( ! isLoading && error instanceof Error ) {
		return (
			<Page maxWidth={ 1032 } className="wcpay-payment-details">
				{ testModeNotice }
				<Card>
					<CardBody>
						{ __(
							'Payment details not loaded',
							'woocommerce-payments'
						) }
					</CardBody>
				</Card>
			</Page>
		);
	}

	return (
		<Page maxWidth={ 1032 } className="wcpay-payment-details">
			{ testModeNotice }
			<ErrorBoundary>
				<PaymentDetailsSummary
					charge={ charge }
					metadata={ metadata }
					isLoading={ isLoading }
					fraudOutcome={ fraudOutcome }
					paymentIntent={ paymentIntent }
				/>
			</ErrorBoundary>
			{ ! isChargeId && wcpaySettings.featureFlags.paymentTimeline && (
				<ErrorBoundary>
					<PaymentDetailsTimeline paymentIntentId={ id } />
				</ErrorBoundary>
			) }
			<ErrorBoundary>
				<PaymentDetailsPaymentMethod
					charge={ charge }
					isLoading={ isLoading }
				/>
			</ErrorBoundary>
		</Page>
	);
};

const PaymentDetails: React.FC< PaymentDetailsProps > = ( props ) => {
	if ( 'card_reader_fee' === props.query.transaction_type ) {
		return (
			<PaymentCardReaderChargeDetails
				chargeId={ props.query.id }
				transactionId={ props.query.transaction_id }
			/>
		);
	}

	return <PaymentChargeDetails id={ props.query.id } />;
};

export default PaymentDetails;