import Pocketbase from 'pocketbase';

const POCKETBASE_API_URL = '/hcgi/platform';

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

const imageMap = {
    '64c337f2-f627-4055-9d43-d348d976dc63.png': 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80',
    '622bf08c-3c84-4e49-a72e-1568f82f7288.png': 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
    'f9bbc10b-9993-4be6-bb20-0f31a23fd314.png': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    '3fb9501e-28bc-4e82-89a5-3377eb9f780b.png': 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1200&q=80',
    '3283c1af-6e58-4eca-a80a-6d5dc5464e9d.png': 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=80',
    '271ce9e7-93a9-4390-b46b-65ec34679e73.png': 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1200&q=80',
    '3ae11c1c-803c-4021-939e-151bd89ffe16.png': 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80',
    '1a411ea8-babd-45bc-add6-73e265f0453a.png': 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    '205049b9-855d-4650-9911-cccbe2bc0f04.png': 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=800&q=80',
    'aadb37ee-05d5-40da-8715-c56376d122d1.png': 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=800&q=80',
    'c912edf6-dac3-4b78-ad57-6d31bf365b61.png': 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=800&q=80',
    '110ca3ea-224e-437e-a9df-df4ae11a443a.png': 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
};

function rewriteUrls(obj) {
    if (!obj || typeof obj !== 'object') {
        if (typeof obj === 'string' && obj.startsWith('https://images.hostinger.com/')) {
            const filename = obj.substring(obj.lastIndexOf('/') + 1);
            return imageMap[filename] || obj;
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(rewriteUrls);
    }

    const newObj = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            newObj[key] = rewriteUrls(obj[key]);
        }
    }
    return newObj;
}

const originalSend = pocketbaseClient.send.bind(pocketbaseClient);
pocketbaseClient.send = async function (path, options) {
    const response = await originalSend(path, options);
    return rewriteUrls(response);
};

export default pocketbaseClient;

export { pocketbaseClient };
