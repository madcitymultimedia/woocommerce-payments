<?php
/**
 * Class Multi_Currency
 *
 * @package WooCommerce\Payments\Multi_Currency
 */

namespace WCPay\Multi_Currency;

defined( 'ABSPATH' ) || exit;

/**
 * Class that controls Multi Currency functionality.
 */
class Multi_Currency {

	const CURRENCY_SESSION_KEY = 'wcpay_currency';

	/**
	 * The single instance of the class.
	 *
	 * @var Multi_Currency
	 */
	protected static $instance = null;

	/**
	 * Frontend_Prices instance.
	 *
	 * @var Frontend_Prices
	 */
	protected $frontend_prices;

	/**
	 * Frontend_Currencies instance.
	 *
	 * @var Frontend_Currencies
	 */
	protected $frontend_currencies;

	/**
	 * The available currencies.
	 *
	 * @var array
	 */
	protected $available_currencies;

	/**
	 * The default currency.
	 *
	 * @var object
	 */
	protected $default_currency;

	/**
	 * The enabled currencies.
	 *
	 * @var array
	 */
	protected $enabled_currencies;

	/**
	 * Main Multi_Currency Instance.
	 *
	 * Ensures only one instance of Multi_Currency is loaded or can be loaded.
	 *
	 * @static
	 * @return Multi_Currency - Main instance.
	 */
	public static function instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct() {
		$this->load_extension_files();

		try {
			$this->init();
		} catch ( Exceptions\Invalid_Default_Currency_Exception $e ) {
			add_action( 'admin_notices', [ $this, 'display_invalid_currency_error_notice' ] );
		}
	}

	/**
	 * Init.
	 *
	 * @throws Exceptions\Invalid_Default_Currency_Exception If the store's default currency is not available.
	 */
	public function init() {
		$this->id = 'wcpay_multi_currency';

		$this->get_available_currencies();
		$this->get_default_currency();
		$this->get_enabled_currencies();

		add_action( 'rest_api_init', [ $this, 'init_rest_api' ] );
		add_action( 'widgets_init', [ $this, 'init_widgets' ] );

		$is_frontend_request = ! is_admin() && ! defined( 'DOING_CRON' ) && ! WC()->is_rest_api_request();

		if ( $is_frontend_request ) {
			add_action( 'init', [ $this, 'update_selected_currency_by_url' ] );

			$this->frontend_prices     = new Frontend_Prices( $this );
			$this->frontend_currencies = new Frontend_Currencies( $this );
		}
	}

	/**
	 * Initialize the REST API controller.
	 */
	public function init_rest_api() {
		include_once WCPAY_ABSPATH . 'includes/multi-currency/class-wc-rest-controller.php';
		$api_controller = new WC_REST_Controller( \WC_Payments::create_api_client() );
		$api_controller->register_routes();
	}

	/**
	 * Initialize the Widgets.
	 */
	public function init_widgets() {
		register_widget( new Currency_Switcher_Widget( $this ) );
	}

	/**
	 * Display error notice explaining that Multi-Currency cannot be loaded for the selected currency.
	 */
	public function display_invalid_currency_error_notice() {
		$invalid_currency_exception = new Exceptions\Invalid_Default_Currency_Exception( get_woocommerce_currency() );

		?>
		<div class="notice notice-error wcpay-multi-currency-message">
			<p>
				<strong><?php echo esc_html_e( 'WooCommerce Payments Multi-Currency:', 'woocommerce-payments' ); ?></strong>
				<?php echo esc_html( $invalid_currency_exception->getMessage() ); ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Gets the mock available.
	 *
	 * @return array Array of currencies.
	 */
	public function get_mock_currencies() {
		return [
			[ 'USD', '1.00' ],
			[ 'CAD', '1.206823' ],
			[ 'GBP', '0.708099' ],
			[ 'EUR', '0.826381' ],
			[ 'AED', '3.6732' ],
			[ 'CDF', '2000' ],
			[ 'NZD', '1.387163' ],
			[ 'DKK', '6.144615' ],
			[ 'BIF', '1974' ], // Zero dollar currency.
			[ 'CLP', '706.8' ], // Zero dollar currency.
		];
	}

	/**
	 * Gets the currencies available.
	 *
	 * @return array Array of Currency objects.
	 */
	public function get_available_currencies() {
		if ( isset( $this->available_currencies ) ) {
			return $this->available_currencies;
		}

		// TODO: This will need to get stored data, then build and return it accordingly.
		$currencies = $this->get_mock_currencies();
		foreach ( $currencies as $currency ) {
			$this->available_currencies[ $currency[0] ] = new Currency( $currency[0], $currency[1] );
		}
		return $this->available_currencies;
	}

	/**
	 * Gets the store base currency.
	 *
	 * @return Currency The store base currency.
	 *
	 * @throws Exceptions\Invalid_Default_Currency_Exception If the store's default currency is not available.
	 */
	public function get_default_currency(): Currency {
		if ( isset( $this->default_currency ) ) {
			return $this->default_currency;
		}

		$woocommerce_currency = get_woocommerce_currency();

		if ( ! array_key_exists( $woocommerce_currency, $this->available_currencies ) ) {
			throw new Exceptions\Invalid_Default_Currency_Exception( $woocommerce_currency, array_keys( $this->available_currencies ) );
		}

		$this->default_currency = $this->available_currencies[ $woocommerce_currency ];

		return $this->default_currency;
	}

	/**
	 * Gets the currently enabled currencies.
	 *
	 * @return array Array of Currency objects.
	 *
	 * @throws Exceptions\Invalid_Default_Currency_Exception If the store's default currency is not available.
	 */
	public function get_enabled_currencies() {
		if ( isset( $this->enabled_currencies ) ) {
			return $this->enabled_currencies;
		}

		$this->enabled_currencies = get_option( $this->id . '_enabled_currencies', false );
		if ( ! $this->enabled_currencies ) {

			// TODO: Remove dev mode option here.
			if ( get_option( 'wcpaydev_dev_mode', false ) ) {
				$count = 0;
				foreach ( $this->available_currencies as $currency ) {
					$this->enabled_currencies[ $currency->code ] = $currency;
					if ( $count >= 3 ) {
						break;
					}
					$count++;
				}
			} else {
				$default = $this->get_default_currency();
				// Need to set the default as an array.
				$this->enabled_currencies[ $default->code ] = $default;
			}
		}

		return $this->enabled_currencies;
	}

	/**
	 * Gets the user selected currency, or `$default_currency` if is not set.
	 *
	 * @return Currency
	 *
	 * @throws Exceptions\Invalid_Default_Currency_Exception If the store's default currency is not available.
	 */
	public function get_selected_currency(): Currency {
		if ( WC()->session ) {
			$code = WC()->session->get( self::CURRENCY_SESSION_KEY );
			return $this->get_enabled_currencies()[ $code ] ?? $this->default_currency;
		}

		return $this->default_currency;
	}

	/**
	 * Update the selected currency from url param `currency`.
	 *
	 * @return void
	 */
	public function update_selected_currency_by_url() {
		if ( ! isset( $_GET['currency'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}

		$code     = strtoupper( sanitize_text_field( wp_unslash( $_GET['currency'] ) ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$currency = $this->get_enabled_currencies()[ $code ] ?? null;

		if ( $currency && WC()->session ) {
			WC()->session->set( self::CURRENCY_SESSION_KEY, $currency->code );
		}
	}

	/**
	 * Gets the rounding precision in the format used by round().
	 *
	 * @return int The rounding precision.
	 */
	public function get_round_precision(): float {
		return apply_filters( 'wcpay_multi_currency_round_precision', 0 );
	}

	/**
	 * Gets the charm pricing to be added to the converted price after rounding.
	 *
	 * @return float The charm pricing.
	 */
	public function get_charm_pricing(): float {
		return apply_filters( 'wcpay_multi_currency_charm_pricing', -0.1 );
	}

	/**
	 * Gets the configured value for apply charm pricing only to products.
	 *
	 * @return bool The configured value.
	 */
	public function get_apply_charm_only_to_products() {
		return apply_filters( 'wcpay_multi_currency_apply_charm_only_to_products', true );
	}

	/**
	 * Gets the converted price using the current currency with the rounding and charm pricing settings.
	 *
	 * @param mixed $price The price to be converted.
	 * @param bool  $type  The type of price being converted. One of 'product', 'shipping', 'tax', or 'coupon'.
	 *
	 * @return float The converted price.
	 *
	 * @throws Exceptions\Invalid_Default_Currency_Exception If the store's default currency is not available.
	 */
	public function get_price( $price, $type ): float {
		$supported_types  = [ 'product', 'shipping', 'tax', 'coupon' ];
		$current_currency = $this->get_selected_currency();

		if (
			! in_array( $type, $supported_types, true ) ||
			$current_currency->get_code() === $this->get_default_currency()->get_code()
		) {
			return (float) $price;
		}

		$converted_price = ( (float) $price ) * $current_currency->get_rate();

		if ( 'tax' === $type || 'coupon' === $type ) {
			return $converted_price;
		}

		$charm_compatible_types = [ 'product', 'shipping' ];
		$apply_charm_pricing    = $this->get_apply_charm_only_to_products()
			? 'product' === $type
			: in_array( $type, $charm_compatible_types, true );

		return $this->get_adjusted_price( $converted_price, $apply_charm_pricing );
	}

	/**
	 * Gets the price after adjusting it with the rounding and charm settings.
	 *
	 * @param float $price               The price to be adjusted.
	 * @param bool  $apply_charm_pricing Whether charm pricing should be applied.
	 *
	 * @return float The adjusted price.
	 */
	protected function get_adjusted_price( $price, $apply_charm_pricing ): float {
		$precision = $this->get_round_precision();
		$charm     = $this->get_charm_pricing();

		$adjusted_price = $this->ceil_price( $price, $precision );

		if ( $apply_charm_pricing ) {
			$adjusted_price += $charm;
		}

		// Do not return negative prices (possible because of $charm).
		return max( 0, $adjusted_price );
	}

	/**
	 * Ceils the price to the next number based on the precision.
	 *
	 * @param float $price     The price to be ceiled.
	 * @param int   $precision The precision to be used.
	 *
	 * @return float The ceiled price.
	 */
	protected function ceil_price( $price, $precision ) {
		$precision_modifier = pow( 10, $precision );
		return ceil( $price * $precision_modifier ) / $precision_modifier;
	}

	/**
	 * Includes the required files for WooCommerce Payments Multi-Currency to work.
	 */
	protected function load_extension_files() {
		include_once WCPAY_ABSPATH . 'includes/multi-currency/class-currency.php';
		include_once WCPAY_ABSPATH . 'includes/multi-currency/class-country-flags.php';
		include_once WCPAY_ABSPATH . 'includes/multi-currency/class-currency-switcher-widget.php';
		include_once WCPAY_ABSPATH . 'includes/multi-currency/class-frontend-prices.php';
		include_once WCPAY_ABSPATH . 'includes/multi-currency/class-frontend-currencies.php';
		include_once WCPAY_ABSPATH . 'includes/multi-currency/exceptions/class-invalid-default-currency-exception.php';
	}
}