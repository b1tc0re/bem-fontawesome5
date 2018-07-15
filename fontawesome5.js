const PATH = require('path'),
    FS = require('fs'),
    TPL = require('./templates'),
    POSTCSS = require('postcss'),
    FONTBLAST = require('font-blast'),
    MV = require('mv');

module.exports = {

    /**
     * Block name
     */
    block       : 'icon',

    /**
     * Block mod glyph
     */
    glyph       : 'glyph',

    /**
     * Block mod background with style
     */
    background  : 'bg',

    /**
     * Block name with mod
     */
    blockWithModName : null,

    /**
     * .fa-clock-o:before
     */
    pattern     : /\.fa\-(.+)\:before/,

    /**
     * Путь к файлам font-awesome
     */
    fontawesomePath      : null,

    glyphToEntityMap : {},
    entityToGlyphMap : {},

    initialize : function () {
        var that = this;
        that.blockWithModName = this.block + '_' + this.background;

        console.debug('Initialize font-awesome generator');

        this.createBlockStructure();
        this.fontawesomePath = PATH.join('node_modules', '@fortawesome/fontawesome-free');

        var cssContent = FS.readFileSync(PATH.join(this.fontawesomePath, 'css', 'fontawesome.css'), 'utf8');

        POSTCSS([this.faPlugin()]).process(cssContent).then(result => {

            FONTBLAST(PATH.join(that.fontawesomePath, 'webfonts', 'fa-solid-900.svg'), 'tmp', { filenames: that.glyphToEntityMap });
            FONTBLAST(PATH.join(that.fontawesomePath, 'webfonts', 'fa-brands-400.svg'), 'tmp', { filenames: that.glyphToEntityMap });
            FONTBLAST(PATH.join(that.fontawesomePath, 'webfonts', 'fa-regular-400.svg'), 'tmp', { filenames: that.glyphToEntityMap });

            const readGlyphs = {};

            Promise.all(Object.keys(that.entityToGlyphMap).map(entity => {
                const glyphId = that.entityToGlyphMap[entity];
                const filename = that.glyphToEntityMap[glyphId] + '.svg';
                const modVal = entity.split('_').pop();

                var svgContent = '';

                if( FS.existsSync(PATH.join('tmp', 'svg', filename)) ) {
                    svgContent = readGlyphs[filename] = FS.readFileSync(PATH.join('tmp', 'svg', filename), 'utf8');
                }
                else
                {
                    var tmpFS = filename.replace('icon_bg_', '');

                    if( FS.existsSync(PATH.join(that.fontawesomePath, 'svgs/brands', tmpFS)) ) {
                        svgContent = readGlyphs[filename] = FS.readFileSync(PATH.join(that.fontawesomePath, 'svgs/brands', tmpFS), 'utf8');
                    } else if( FS.existsSync(PATH.join(that.fontawesomePath, 'svgs/regular', tmpFS)) ) {
                        svgContent = readGlyphs[filename] = FS.readFileSync(PATH.join(that.fontawesomePath, 'svgs/regular', tmpFS), 'utf8');
                    } else if( FS.existsSync(PATH.join(that.fontawesomePath, 'svgs/solid', tmpFS)) ) {
                        svgContent = readGlyphs[filename] = FS.readFileSync(PATH.join(that.fontawesomePath, 'svgs/solid', tmpFS), 'utf8');
                    } else {
                        return ;
                    }

                }

                FS.writeFileSync(PATH.join(that.block, '_' + that.glyph, that.block + '_' + that.glyph + '_' + modVal + '.bemhtml.js'),
                    TPL.initialize(that.glyph).bemhtml(modVal, svgContent));

                FS.writeFileSync(PATH.join(that.block, '_' + that.glyph, that.block + '_' + that.glyph + '_' + modVal + '.bh.php'),
                    TPL.initialize(that.glyph).bhPhp(modVal, svgContent));

                FS.writeFileSync(PATH.join(that.block, '_' + that.glyph, that.block + '_' + that.glyph + '_' + modVal + '.bh.js'),
                    TPL.initialize(that.glyph).bhJs(modVal, svgContent));

                return MV(PATH.join('tmp', 'svg', filename), PATH.join(__dirname, that.block, '_' + that.background, filename), err => {
                    if (err && err.code !== 'ENOENT') console.error(err);
                });
            }));
        });
    },

    /**
     * Create structure mods
     */
    createBlockStructure : function () {

        FS.existsSync(this.block) || FS.mkdirSync(this.block);

        // Create glyph mod
        if (!FS.existsSync(PATH.join(this.block, '_' + this.glyph))) {
            FS.mkdirSync(PATH.join(this.block, '_' + this.glyph));
        }

        // Create background mod
        if (!FS.existsSync(PATH.join(this.block, '_' + this.background))) {
            FS.mkdirSync(PATH.join(this.block, '_' + this.background));
        }
    },

    /**
     * Post css plugin
     * @return {postcss.Plugin<any>}
     */
    faPlugin : function () {
        var that = this;

        return POSTCSS.plugin('fa', function(options = {}) {
            return function(css) {
                css.walkRules(function(rule) {
                    const selectors = rule.selector.split(',');

                    let firstParsedModVal;

                    selectors.forEach(selector => {
                        const parsedSelector = that.pattern.exec(selector);

                        if (!parsedSelector) return;

                        const modVal = parsedSelector[1];
                        firstParsedModVal || (firstParsedModVal = modVal);

                        const styleArr = [
                            '.' + that.blockWithModName + '_' + modVal + ' {'
                        ];

                        rule.walkDecls(function(decl, i) {
                            const glyphId = decl.value.slice(2, decl.value.length - 1);

                            that.glyphToEntityMap[glyphId] = that.blockWithModName + '_' + firstParsedModVal;
                            that.entityToGlyphMap[that.blockWithModName + '_' + modVal] = glyphId;

                            styleArr.push(decl.raws.before + "\n  background-image: url(" + that.blockWithModName + '_' + firstParsedModVal + '.svg);');
                        });

                        styleArr.push('\n}');

                        FS.writeFileSync(PATH.join(that.block, '_' + that.background, that.blockWithModName + '_' + modVal + '.css'), styleArr.join(''));
                    });
                });
            }
        });
    }
};