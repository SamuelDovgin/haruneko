import { Tags } from '../../Tags';
import icon from './EHentai.webp';
import { type Chapter, DecoratableMangaScraper, Page } from '../../providers/MangaPlugin';
import { FetchCSS } from '../../platform/FetchProvider';
import * as Common from '../decorators/Common';

@Common.MangaCSS(/^{origin}\/g\/\d+\/[0-9a-f]+\/$/, 'div.gm div#gd2 h1#gn')
@Common.MangasNotSupported()
@Common.ChaptersUniqueFromManga()
@Common.ImageAjaxFromHTML('img#img')
export default class extends DecoratableMangaScraper {

    public constructor() {
        super(
            'ehentai',
            'E-Hentai',
            'https://e-hentai.org',
            Tags.Media.Manga,
            Tags.Media.Comic,
            Tags.Language.Multilingual,
            Tags.Source.Aggregator,
            Tags.Rating.Pornographic,
        );
    }

    public override get Icon() {
        return icon;
    }

    public override async FetchPages(chapter: Chapter): Promise<Page[]> {
        const gallery = new URL(chapter.Identifier, this.URI);
        const firstRequest = new Request(gallery, {
            headers: { Referer: gallery.href },
        });
        const pagination = await FetchCSS<HTMLAnchorElement>(firstRequest, 'table.ptt td a');
        const pageCount = Math.max(
            1,
            ...pagination
                .map(anchor => Number.parseInt(anchor.textContent.trim(), 10))
                .filter(Number.isFinite),
        );

        const pages: Page[] = [];
        for (let index = 0; index < pageCount; index++) {
            const uri = new URL(gallery);
            if (index > 0) {
                uri.searchParams.set('p', `${index}`);
            }

            const request = index === 0
                ? firstRequest
                : new Request(uri, { headers: { Referer: gallery.href } });
            const viewers = await FetchCSS<HTMLAnchorElement>(request, 'div#gdt a');
            pages.push(...viewers.map(anchor => {
                const viewer = new URL(anchor.href, uri);
                return new Page(this, chapter, viewer, { Referer: viewer.href });
            }));
        }

        return pages.filter((page, index, all) =>
            index === all.findIndex(candidate => candidate.Link.href === page.Link.href),
        );
    }
}
