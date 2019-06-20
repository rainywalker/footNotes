
(function(){
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');
    /**
     * 
     * @param str
     * @param data
     * @returns {*}
     */
    var replaceTmpl = function(str, data) {
        var result = str;
        for (var key in data) {
            result = result.replace(/\{(\/?[^\}]+)\}/gm,data[key]);
        }
        return result;
    };

    /**
     * 
     * @param editor
     */
    var open = function (editor) {
        var selectedNode = editor.selection.getNode(), name = '',
            isFootNotes = selectedNode.tagName == 'SPAN' && editor.dom.getAttrib(selectedNode, 'class') === 'fnoteWrap';

        var selectIndex = (function(){
            if (selectedNode.className == 'fnoteWrap') {
                var num = selectedNode.childNodes[0].firstChild.nodeValue.replace(/[^0-9]/g,'');
                return num;
            }
            else {
                return selectedNode.childNodes[0];
            }
        }());

        if (isFootNotes) {
            name = selectedNode.name || decodeURIComponent(selectedNode.childNodes[0].getAttribute('data-content')) || '';
        }
        
        
        editor.windowManager.open({
            title: 'Insert Contents',
            size: 'normal',
            body: {
                type: 'panel',
                items : [
                    {
                        type:'textarea',
                        name: 'name',
                        multiline: true,
                        minWidth: 520,
                        minHeight: 100,

                    }
                ],
            },
            buttons: [
                {
                    type: 'cancel',
                    name: 'cancel',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'save',
                    text: 'Save',
                    primary: true
                }
            ],

            initialData: { name: name },
            onSubmit: function (e) {
                var newfootnoteContent = e.getData().name,
                    fixFootnoteContent = (function () {
                        return encodeURIComponent(newfootnoteContent);
                    }()),
                    htmlTemplate = '<span class="fnoteWrap" id="#wk_ft{FOOTNOTE_INDEX}" contenteditable="false"><button type="button" class="fnoteBtn" data-content="'+fixFootnoteContent+'">{FOOTNOTE_INDEX}</button></span>&nbsp;',
                    totalFootNote = editor.getDoc().querySelectorAll('.fnoteBtn'),
                    totalCount = totalFootNote.length,
                    html;

                function findNextFD($node) {

                    var nextInDOM = function(_selector, $node) {
                        var next = getNext($node);

                        while(next.length !== 0) {
                            var found = searchFor(_selector, next);
                            if(found !== null) {
                                return found;
                            }
                            next = getNext(next);
                        }
                        return next;
                    }

                    var getNext = function($node) {
                        if($node.nextAll().find('.fnoteBtn').length > 0) {
                            if ($node.next().hasClass('fnoteBtn')) {
                                return $node.next().children().children();
                            }
                            else {
                                return $node.nextAll().find('.fnoteBtn');
                            }

                        }
                        else {
                            if ($node.prop('nodeName') == 'BODY') {
                                return [];
                            }
                            return getNext($node.parent());
                        }
                    }
                    var searchFor = function(_selector, $node) {
                        if (!$node) {return false};
                        if($node) {
                            return $node;
                        }
                        else {
                            var found = null;
                            $node.children().each(function() {
                                if ($node)
                                    found = searchFor(_selector, $(this));
                            });
                            return found;
                        }
                        return null;
                    }
                    var currentClassNot_NextClass = nextInDOM('.fnoteBtn', $node);

                    return currentClassNot_NextClass;
                }

                var nextFD = findNextFD($(editor.selection.getRng().endContainer));

                if(nextFD.length) {
                    nextFD = nextFD[0];
                    var foundIdx;
                    for(foundIdx = 0; foundIdx < totalCount; foundIdx++) {
                        if(nextFD == totalFootNote[foundIdx]) {
                            break;
                        }
                    }
                    if (selectIndex < totalCount) {
                        // modify
                        html = replaceTmpl(htmlTemplate,{FOOTNOTE_INDEX : $(totalFootNote[selectIndex-1]).html()});
                    }
                    else {
                        // anywhere add
                        html = replaceTmpl(htmlTemplate,{FOOTNOTE_INDEX : $(totalFootNote[foundIdx]).html()});
                        editor.selection.collapse(0);
                    }

                } else {
                    // last add
                    html = replaceTmpl(htmlTemplate,{FOOTNOTE_INDEX : totalCount + 1});
                    editor.selection.collapse(0);
                }

                editor.execCommand('mceInsertContent', false, html);
                e.close()

                // index realignment
                $(editor.getDoc()).find('.fnoteBtn').each(function(idx){
                    $(this).text((idx+1));
                    $(this).parent().attr('id','#wk_ft' + (idx +1));
                });
            }
        });
    };
    var Dialog = { open: open };
    var register$1 = function (editor) {
        editor.ui.registry.addToggleButton('footnotes', {
            text: 'footnotes',
            tooltip: 'footnotes',
            onAction: function () {

                return editor.execCommand('footnotes');
            },
            onSetup: function (buttonApi) {
                return editor.selection.selectorChangedWithUnbind('span.fnoteWrap', buttonApi.setActive).unbind;
            }
        });
        editor.ui.registry.addMenuItem('footnotes', {
            text: 'footnotes',
            text: 'footNotes...',
            onAction: function () {
                return editor.execCommand('footnotes');
            }
        });
    };
    
    var register = function (editor) {
        editor.addCommand('footnotes', function () {

            Dialog.open(editor);
        });
    };

    var Commands = { register: register };
    var Buttons = { register: register$1 };

    function Plugin () {
        global.add('footnotes', function (editor) {
            Commands.register(editor);
            Buttons.register(editor);
        });
    }

    Plugin();
})()

