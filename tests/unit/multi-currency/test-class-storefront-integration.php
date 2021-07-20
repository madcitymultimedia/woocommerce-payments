<?php
/**
 * Class WCPay_Multi_Currency_Storefront_Integration_Tests
 *
 * @package WooCommerce\Payments\Tests
 */

use WCPay\MultiCurrency\MultiCurrency;
use WCPay\MultiCurrency\StorefrontIntegration;

/**
 * WCPay\MultiCurrency\StorefrontIntegration unit tests.
 */
class WCPay_Multi_Currency_Storefront_Integration_Tests extends WP_UnitTestCase {
	/**
	 * Mock MultiCurrency.
	 *
	 * @var MultiCurrency|PHPUnit_Framework_MockObject_MockObject
	 */
	private $mock_multi_currency;

	/**
	 * Pre-test setup
	 */
	public function setUp() {
		parent::setUp();

		$this->mock_multi_currency    = $this->createMock( MultiCurrency::class );
		$this->storefront_integration = new StorefrontIntegration( $this->mock_multi_currency );
	}

	public function tearDown() {
		remove_all_filters( 'stylesheet' );
		remove_all_filters( 'option_wcpay_multi_currency_enable_storefront_switcher' );

		parent::tearDown();
	}

	/**
	 * @dataProvider switcher_filter_provider
	 */
	public function test_does_not_register_actions_when_switcher_disabled( $filter, $function_name ) {
		$this->mock_theme( 'storefront' );
		$this->mock_option( 'no' );
		// Reinit class to re-evaluate conditional hooks.
		$this->storefront_integration = new StorefrontIntegration( $this->mock_multi_currency );

		$this->assertFalse(
			has_filter( $filter, [ $this->storefront_integration, $function_name ] ),
			"The filter '$filter' with function '$function_name' was found."
		);
	}


	/**
	 * @dataProvider switcher_filter_provider
	 */
	public function test_registers_default_actions_when_switcher_enabled( $filter, $function_name ) {
		$this->mock_theme( 'storefront' );
		// Reinit class to re-evaluate conditional hooks.
		$this->storefront_integration = new StorefrontIntegration( $this->mock_multi_currency );

		$this->assertGreaterThan(
			10,
			has_filter( $filter, [ $this->storefront_integration, $function_name ] ),
			"The filter '$filter' with function '$function_name' was not registered with a priority above 10."
		);
	}

	/**
	 * @dataProvider switcher_filter_provider
	 */
	public function test_registers_actions_when_switcher_enabled_and_storefront_theme_found( $filter, $function_name ) {
		$this->mock_theme( 'storefront' );
		// Reinit class to re-evaluate conditional hooks.
		$this->storefront_integration = new StorefrontIntegration( $this->mock_multi_currency );

		$this->assertGreaterThan(
			10,
			has_filter( $filter, [ $this->storefront_integration, $function_name ] ),
			"The filter '$filter' with function '$function_name' was not registered with a priority above 10."
		);
	}

	public function switcher_filter_provider() {
		return [
			[ 'woocommerce_breadcrumb_defaults', 'modify_breadcrumb_defaults' ],
			[ 'wp_enqueue_scripts', 'add_inline_css' ],
		];
	}

	private function mock_theme( $theme ) {
		add_filter(
			'stylesheet',
			function() use ( $theme ) {
				return $theme;
			}
		);
	}

	private function mock_option( $value ) {
		add_filter(
			'pre_option_wcpay_multi_currency_enable_storefront_switcher',
			function() use ( $value ) {
				return $value;
			}
		);
	}
}
