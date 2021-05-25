/**
 * External dependencies
 */
import React from 'react';
import { useSelect } from '@wordpress/data';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import WizardTaskContext from '../../wizard/task/context';
import AddPaymentMethodsTask from '../add-payment-methods-task';
import {
	useEnabledPaymentMethodIds,
	useGetAvailablePaymentMethodIds,
	useSettings,
} from '../../../data';

jest.mock( '../../../data', () => ( {
	useEnabledPaymentMethodIds: jest.fn(),
	useGetAvailablePaymentMethodIds: jest.fn(),
	useSettings: jest.fn(),
} ) );
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
} ) );

describe( 'AddPaymentMethodsTask', () => {
	beforeEach( () => {
		useSelect.mockReturnValue( {} );
		useEnabledPaymentMethodIds.mockReturnValue( {
			enabledPaymentMethodIds: [
				'woocommerce_payments',
				'woocommerce_payments_giropay',
			],
			updateEnabledPaymentMethodIds: jest.fn(),
		} );
		useGetAvailablePaymentMethodIds.mockReturnValue( [
			'woocommerce_payments',
			'woocommerce_payments_giropay',
			'woocommerce_payments_sofort',
			'woocommerce_payments_sepa',
		] );
		useSettings.mockReturnValue( {
			saveSettings: jest.fn().mockResolvedValue( true ),
			isSaving: false,
		} );
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );

	it( 'should render the payment methods checkboxes with default values', () => {
		render(
			<WizardTaskContext.Provider value={ {} }>
				<AddPaymentMethodsTask />
			</WizardTaskContext.Provider>
		);

		expect(
			screen.getByRole( 'checkbox', { name: 'Credit card / debit card' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'GiroPay' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Sofort' } )
		).not.toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Direct Debit Payments' } )
		).not.toBeChecked();
	} );

	it( 'should not render the checkboxes that are not available', () => {
		useGetAvailablePaymentMethodIds.mockReturnValue( [
			'woocommerce_payments',
			'woocommerce_payments_giropay',
		] );

		render(
			<WizardTaskContext.Provider value={ {} }>
				<AddPaymentMethodsTask />
			</WizardTaskContext.Provider>
		);

		expect(
			screen.queryByRole( 'checkbox', {
				name: 'Credit card / debit card',
			} )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: 'GiroPay' } )
		).toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: 'Sofort' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'checkbox', { name: 'Direct Debit Payments' } )
		).not.toBeInTheDocument();
	} );

	it( 'should save the checkboxes state on "continue" click', async () => {
		const updateEnabledPaymentMethodIdsMock = jest.fn();
		useEnabledPaymentMethodIds.mockReturnValue( {
			enabledPaymentMethodIds: [ 'woocommerce_payments' ],
			updateEnabledPaymentMethodIds: updateEnabledPaymentMethodIdsMock,
		} );
		const setCompletedMock = jest.fn();
		render(
			<WizardTaskContext.Provider
				value={ { setCompleted: setCompletedMock } }
			>
				<AddPaymentMethodsTask />
			</WizardTaskContext.Provider>
		);

		// Marks the CC payment method as un-checked
		userEvent.click(
			screen.getByRole( 'checkbox', {
				name: 'Credit card / debit card',
			} )
		);
		// Marks the Giropay payment method as checked
		userEvent.click(
			screen.getByRole( 'checkbox', {
				name: 'GiroPay',
			} )
		);

		expect( setCompletedMock ).not.toHaveBeenCalled();
		expect( updateEnabledPaymentMethodIdsMock ).not.toHaveBeenCalled();

		userEvent.click( screen.getByText( 'Continue' ) );

		await waitFor( () => expect( setCompletedMock ).toHaveBeenCalled() );

		expect( setCompletedMock ).toHaveBeenCalledWith(
			true,
			'setup-complete'
		);
		expect( updateEnabledPaymentMethodIdsMock ).toHaveBeenCalledWith( [
			'woocommerce_payments_giropay',
		] );
	} );
} );