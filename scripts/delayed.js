// eslint-disable-next-line import/no-cycle
import { sampleRUM, loadScript } from './aem.js';

const loadDelayed = async () => {
  window.utag_data = {
    user_type: '',
    brand_name: 'ups.com',
    product_affiliation_campusship: '',
    product_affiliation_mychoice: '',
    product_affiliation_quantumview: 'false',
    product_affiliation_worldship: '',
    product_affiliation_mychoice_basic: 'true',
    product_affiliation_mychoice_premium: 'false',
    product_affiliation_fgv: '',
    product_affiliation_campusship_admin: '',
    product_affiliation_billing_center: 'false',
    product_affiliation_cvadmin: 'false',
    product_affiliation_cvuser: 'false',
    preferred_customer: 'false',
    business_type: '',
    business_user_company_size: '',
    business_user_industry: '',
    business_user_naics: '',
    business_user_revenue: '',
    business_user_sic: '',
    business_user_sub_industry: '',
    wem_tdx_existing_account: '',
    wem_tdx_national: '',
    wem_tdx_campaign_id: '',
    campusship_state: '',
    preferred_shipper_status: 'false',
    product_affiliation_qvm_admin: 'false',
    product_affiliation_qvd_admin: 'false',
    business_b2b: '',
    business_b2c: '',
    product_affiliation_mc4buser: 'false',
    site_indicator: 'SiteB',
    page_id: 'Home.page',
    page_name: 'Home',
    page_language: 'en',
    page_country_code: 'US',
    error_code: '',
    encrypted_login_id: '',
    myups_login_state: '1',
    event_id: '0',
    page_type: '',
    site_area: '',
    brdcrmb: '',
    site_sub_area: '',
    page_category: 'Marketing',
  };
  await loadScript('https://tags.tiqcdn.com/utag/ups/yoda/prod/utag.sync.js');
  loadScript('https://tags.tiqcdn.com/utag/ups/yoda/prod/utag.js');
};

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
loadDelayed();
