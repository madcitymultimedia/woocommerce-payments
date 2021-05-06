/** @format */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './index.scss';
import SettingsSection from '../settings-section';
import { getPaymentSettingsUrl } from '../../utils';
import GiropaySettings from './giropay-settings';

/* eslint-disable camelcase */
const methods = {
	woocommerce_payments_giropay: {
		title: 'giropay',
		description: 'giropay description.',
		controls: () => <GiropaySettings />,
	},
};
/* eslint-enable camelcase */

const PaymentMethodSettings = ( { methodId } ) => {
	const method = methods[ methodId ];

	if ( ! method ) {
		return (
			<p>
				{ __(
					'Invalid payment method ID specified.',
					'woocommerce-payments'
				) }
			</p>
		);
	}

	const { title, description, controls: Controls } = method;

	return (
		<div className="payment-method-settings">
			<h2 className="payment-method-settings__breadcrumbs">
				<a href={ getPaymentSettingsUrl() }>WooCommerce Payments</a>{ ' ' }
				&gt; <span>{ title }</span>
			</h2>

			<SettingsSection title={ title } description={ description }>
				<Controls />
			</SettingsSection>
		</div>
	);
};

export default PaymentMethodSettings;