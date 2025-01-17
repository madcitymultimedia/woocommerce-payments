/** @format */

/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Chip from 'components/chip';
import './style.scss';

const StatusChip = ( props ) => {
	const { accountStatus } = props;

	let description = __( 'Unknown', 'woocommerce-payments' );
	let type = 'light';
	let tooltip = '';
	if ( 'complete' === accountStatus ) {
		description = __( 'Complete', 'woocommerce-payments' );
		type = 'primary';
	} else if ( 'restricted_soon' === accountStatus ) {
		description = __( 'Restricted soon', 'woocommerce-payments' );
		type = 'warning';
	} else if ( 'pending_verification' === accountStatus ) {
		description = __( 'Pending', 'woocommerce-payments' );
		type = 'light';
		tooltip = __(
			'Deposits are pending while Stripe verifies details on your account.',
			'woocommerce-payments'
		);
	} else if ( 'restricted_partially' === accountStatus ) {
		description = __( 'Restricted partially', 'woocommerce-payments' );
		type = 'warning';
	} else if ( 'restricted' === accountStatus ) {
		description = __( 'Restricted', 'woocommerce-payments' );
		type = 'alert';
	} else if ( accountStatus.startsWith( 'rejected' ) ) {
		description = __( 'Rejected', 'woocommerce-payments' );
		type = 'light';
	}

	return (
		<Chip
			message={ description }
			type={ type }
			isCompact
			tooltip={ tooltip }
		/>
	);
};

export default StatusChip;
