import { TestFixture } from '../../../test/WebsitesFixture';

new TestFixture({
    plugin: {
        id: 'ehentai',
        title: 'E-Hentai',
    },
    container: {
        url: 'https://e-hentai.org/g/3957135/c4fa42b15f/',
        id: '/g/3957135/c4fa42b15f/',
        title: '[PULIN Nabe (kakenari)] Onabe Hon YF2026 -Summer- [Digital]',
    },
    child: {
        id: '/g/3957135/c4fa42b15f/',
        title: '[PULIN Nabe (kakenari)] Onabe Hon YF2026 -Summer- [Digital]',
    },
    entry: {
        index: 0,
        size: 530_762,
        type: 'image/webp',
    },
}).AssertWebsite();

new TestFixture({
    plugin: {
        id: 'ehentai',
        title: 'E-Hentai',
    },
    container: {
        url: 'https://e-hentai.org/g/4036064/8e2874a66c/',
        id: '/g/4036064/8e2874a66c/',
        title: '[C-O-Two- (Nayoshi)] Kokoro to Karada no Hogushiya-san | Mind & Body Relaxation [English] [Decensored]',
    },
    child: {
        id: '/g/4036064/8e2874a66c/',
        title: '[C-O-Two- (Nayoshi)] Kokoro to Karada no Hogushiya-san | Mind & Body Relaxation [English] [Decensored]',
    },
    entry: {
        index: 48,
        size: 91_784,
        type: 'image/webp',
    },
}).AssertWebsite();
