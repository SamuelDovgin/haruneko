import { TestFixture } from '../../../test/WebsitesFixture';

new TestFixture({
    plugin: {
        id: 'nhentaiyaoi',
        title: 'nHentai Yaoi',
    },
    container: {
        url: 'https://nhentaiyaoi.net/dont-get-caught/',
        id: '/dont-get-caught/',
        title: '[Midnyte] Don’t Get Caught [English] (Invincible)',
    },
    child: {
        id: '/dont-get-caught/',
        title: '[Midnyte] Don’t Get Caught [English] (Invincible)',
    },
    entry: {
        index: 0,
        size: 199_658,
        type: 'image/webp',
    },
}).AssertWebsite();
