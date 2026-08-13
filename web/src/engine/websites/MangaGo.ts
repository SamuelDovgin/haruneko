import { Tags } from '../Tags';
import icon from './MangaGo.webp';
import type { Priority } from '../taskpool/DeferredTask';
import { DecoratableMangaScraper, Manga, type MangaPlugin, Chapter, Page } from '../providers/MangaPlugin';
import { FetchWindowScript } from '../platform/FetchProvider';
import DeScramble from '../transformers/ImageDescrambler';
import * as Common from './decorators/Common';

import { DRMProvider } from './MangaGo.DRM';

@Common.MangasMultiPageCSS('div.pic_list span.title a', Common.PatternLinkGenerator('/genre/all/{page}/'), 0, Common.AnchorInfoExtractor(true))
export default class extends DecoratableMangaScraper {

    readonly #drm = new DRMProvider();

    public constructor() {
        super('mangago', 'MangaGo', 'https://www.mangago.me', Tags.Media.Manga, Tags.Media.Manhua, Tags.Media.Manhwa, Tags.Language.English, Tags.Source.Aggregator);
    }

    public override get Icon() {
        return icon;
    }

    public override ValidateMangaURL(url: string): boolean {
        return new RegExpSafe(`^${this.URI.origin}/read-manga/[^/]+/$`).test(url);
    }

    public override async FetchManga(provider: MangaPlugin, url: string): Promise<Manga> {
        const uri = new URL(url);
        const title = await FetchWindowScript<string>(new Request(uri), `
            document.querySelector('div#page div.people-panel div.w-title h1')?.textContent?.trim()
                || document.querySelector('meta[property="og:title"]')?.content?.trim()
                || document.title.replace(/\\s*(?:manga\\s*)?-\\s*Mangago.*$/i, '').trim();
        `, 500);
        return new Manga(this, provider, uri.pathname, title);
    }

    public override async FetchChapters(manga: Manga): Promise<Chapter[]> {
        const data = await this.#drm.CreateChapterList(this.URI, new URL(manga.Identifier, this.URI));
        // MangaGo returns its visible listing newest-first. Prefixing with the
        // inverse list index gives the oldest entry 0001 and keeps that position
        // in both HakuNeko's UI and the downloaded folder name. This also gives
        // unnumbered notices, extras, and side stories an exact relative order.
        return data.map(({ id, title }, index) => {
            const position = String(data.length - index).padStart(4, '0');
            return new Chapter(this, manga, id, `${position}.000_${title}`);
        });
    }

    public override async FetchPages(chapter: Chapter): Promise<Page[]> {
        const data = await this.#drm.CreatePageLinks(new URL(chapter.Identifier, this.URI));
        return data.map(link => new Page(this, chapter, new URL(link, this.URI)));
    }

    public override async FetchImage(page: Page, priority: Priority, signal: AbortSignal): Promise<Blob> {
        page.Link.href = await this.#drm.CreateImageLink(page.Link);
        const blob = await Common.FetchImageAjax.call(this, page, priority, signal);
        return !/cspiclink/.test(page.Link.href) ? blob : DeScramble(blob, async (image, ctx) => this.#drm.DescrambleImage(page.Link.href, image, ctx));
    }
}
