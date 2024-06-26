// eslint-disable-next-line import/no-cycle
import { sampleRUM, loadScript } from './aem.js';

const loadDelayed = async () => {
  loadScript('https://tags.tiqcdn.com/utag/ups/yoda/prod/utag.sync.js');
};

// Core Web Vitals RUM collection
sampleRUM('cwv');

// add more delayed functionality here
loadDelayed();
