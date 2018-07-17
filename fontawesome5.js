const PATH = require('path'),
      FS = require('fs'),
      TPL = require('./templates');


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

    
    initialize: function () {
        var that = this;
        var fontAwesomePathBrand = PATH.join('node_modules', '@fortawesome/fontawesome-free/svgs/brands'),
            fontAwesomePathRegular = PATH.join('node_modules', '@fortawesome/fontawesome-free/svgs/regular'),
            fontAwesomePathSolid = PATH.join('node_modules', '@fortawesome/fontawesome-free/svgs/solid');

        that.createBlockStructure();

        // FontAwesome - brands
        FS.readdirSync(fontAwesomePathBrand).forEach(fileName => {

            that.createAndCopy(fileName, 'fab-', PATH.join(fontAwesomePathBrand, fileName));
        });

        // FontAwesome - regular
        FS.readdirSync(fontAwesomePathRegular).forEach(fileName => {
            that.createAndCopy(fileName, 'far-', PATH.join(fontAwesomePathRegular, fileName));
        });

        // FontAwesome - solid
        FS.readdirSync(fontAwesomePathSolid).forEach(fileName => {
            that.createAndCopy(fileName, '', PATH.join(fontAwesomePathSolid, fileName));
        });
    },

    /**
     * Create structure mods
     */
    createBlockStructure: function () {

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
     * Create glyph file template
     *
     * @param fileName
     * @param prefix
     * @param realPath
     */
    createAndCopy: function(fileName, prefix, realPath) {

        var modVal = prefix + fileName.replace('.svg', ''),
            blockWithMod = 'icon_' + this.background,
            content = this.normalizeContent(FS.readFileSync(realPath, 'utf8')),
            pathGlyph = PATH.join(this.block, '_' + this.glyph, this.block + '_' + this.glyph + '_' + modVal);

        this.createGlyphPath(pathGlyph, modVal, content);


        const styleArr = [
            '.' + blockWithMod + '_' + modVal + ' {',
            "\n\tbackground-image: url(" + this.block + '_' + this.background + '_' + modVal + ".svg);",
            "\n}"
        ];

        //var pathToBg = PATH.join(this.block, '_' + this.background, this.block + '_' + this.background + '_' + modVal + '.css');
        //FS.writeFileSync(pathToBg, styleArr.join(''));

        FS.writeFileSync(PATH.join(this.block, '_' + this.background, this.block + '_' + this.background + '_' + modVal + '.css'), styleArr.join(''));

        //this.copyFile(PATH.join(this.block, '_' + this.background, this.block + '_' + this.background +'_' + modVal + ".svg"), content);
        this.copyFile(realPath, PATH.join(this.block, '_' + this.background, this.block + '_' + this.background +'_' + modVal + ".svg"));
    },


    /**
     * Create glyph files
     *
     * @param glyphPath
     * @param modVal
     * @param svgContent
     */
    createGlyphPath: function (glyphPath, modVal, svgContent) {
        FS.writeFileSync(glyphPath + '.bemhtml.js', TPL.initialize(this.glyph).bemhtml(modVal, svgContent));
        FS.writeFileSync(glyphPath + '.bh.php', TPL.initialize(this.glyph).bhJs(modVal, svgContent));
        FS.writeFileSync(glyphPath + '.bh.js', TPL.initialize(this.glyph).bhPhp(modVal, svgContent));
    },

    /**
     * Copy file source to target
     *
     * @param source
     * @param target
     */
    copyFile : function (source, target) {
        FS.createReadStream(source).pipe(FS.createWriteStream(target));
    },

    /**
     * Normalize content
     * @param content
     * @returns {string}
     */
    normalizeContent : function (content) {
        var COMMENT_PSEUDO_COMMENT_OR_LT_BANG = new RegExp(
            '<!--[\\s\\S]*?(?:-->)?'
            + '<!---+>?'  // A comment with no body
            + '|<!(?![dD][oO][cC][tT][yY][pP][eE]|\\[CDATA\\[)[^>]*>?'
            + '|<[?][^>]*>?',  // A pseudo-comment
            'g');

        return content.replace(COMMENT_PSEUDO_COMMENT_OR_LT_BANG, '').replace("\n", "");
    }
    
};