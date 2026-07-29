import { Tags } from '../Tags';
import { DecoratableMangaScraper } from '../providers/MangaPlugin';
import * as Common from './decorators/Common';

@Common.MangaCSS(/^{origin}\/[^/]+\/$/, 'h1.post-titulo')
@Common.MangasNotSupported()
@Common.ChaptersUniqueFromManga()
@Common.PagesSinglePageCSS('div.listaImagens ul.post-fotos li img')
@Common.ImageAjax()
export default class extends DecoratableMangaScraper {

    public constructor() {
        super(
            'nhentaiyaoi',
            'nHentai Yaoi',
            'https://nhentaiyaoi.net',
            Tags.Media.Manga,
            Tags.Media.Comic,
            Tags.Language.English,
            Tags.Source.Aggregator,
            Tags.Rating.Pornographic,
        );
    }
}
