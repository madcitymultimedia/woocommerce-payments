/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import interpolateComponents from '@automattic/interpolate-components';
import { Link } from '@woocommerce/components';

/**
 * Internal dependencies
 */
import FraudProtectionRuleCard from '../rule-card';
import FraudProtectionRuleDescription from '../rule-description';
import FraudProtectionRuleCardNotice from '../rule-card-notice';

const CVCVerificationRuleCard = () => (
	<FraudProtectionRuleCard
		title={ __( 'CVC Verification', 'woocommerce-payments' ) }
		description={ __(
			'This filter checks the security code submitted by the customer against the data on file with the card issuer.',
			'woocommerce-payments'
		) }
	>
		<FraudProtectionRuleDescription>
			{ __(
				'Because the card security code appears only on the card and not on receipts or statements, the card security code ' +
					'provides some assurance that the physical card is in the possession of the buyer.',
				'woocommerce-payments'
			) }
		</FraudProtectionRuleDescription>
		<FraudProtectionRuleCardNotice type="warning">
			{ interpolateComponents( {
				mixedString: __(
					'Payments failing CVC verification will be blocked. For security, this filter ' +
						'cannot be modified. {{learnMoreLink}}Learn more{{/learnMoreLink}}',
					'woocommerce-payments'
				),
				components: {
					learnMoreLink: (
						// eslint-disable-next-line max-len
						<Link href="https://woocommerce.com/document/payments/additional-payment-methods/#available-methods" />
					),
				},
			} ) }
		</FraudProtectionRuleCardNotice>
	</FraudProtectionRuleCard>
);

export default CVCVerificationRuleCard;