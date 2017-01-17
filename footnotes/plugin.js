if (!String.prototype.supplant) {
    String.prototype.supplant = function (o) {
        return this.replace(/{([^{}]*)}/g,
            function (a, b) {
                var r = o[b];
                return typeof r === 'string' || typeof r === 'number' ? r : a;
            }
        );
    };
};

tinymce.PluginManager.add('footnotes', function(editor) {
    function showDialog() {
        var selectedNode = editor.selection.getNode(), name = '';
        var isFootNotes = selectedNode.tagName == 'SPAN' && editor.dom.getAttrib(selectedNode, 'class') === 'wiki-fnote';

        var selectIndex = (function(){

            if (selectedNode.className == 'wiki-fnote') {
                var num = selectedNode.childNodes[0].firstChild.nodeValue.replace(/[^0-9]/g,'');
                console.log(num)
                return num
            }
            else {
                return selectedNode.childNodes[0]
            }
        }())


        if (isFootNotes) {
            name = selectedNode.name || decodeURIComponent(selectedNode.childNodes[0].getAttribute('data-content')) || '';
        }


        editor.windowManager.open({
            title: "Add a footnote",
            id: 'footnote-dialog',
            body: {
                type: 'textbox',
                name: 'name',
                multiline: true,
                minWidth: 520,
                minHeight: 100,
                value : name
            },

            onSubmit: function(e) {
                //e.preventDefault();
                // var htmlTemplate = '<span data-cls="foot" class="wiki-fnote" id="{FOOTNOTE}" contentEditable="false">[<button class="wiki-fnotepop" data-toggle="popover" data-placement="auto bottom" data-content="{FOOTNOTE}">{FOOTNOTE_INDEX}</button>]</span>&nbsp;';
                var htmlTemplate = '<span data-cls="foot" class="wiki-fnote" id="#wk_ft{FOOTNOTE_INDEX}" contentEditable="false"><button class="wiki-fnotepop" data-container=".wiki-fnote"  data-placement="auto bottom" data-content="{FOOTNOTE}">{FOOTNOTE_INDEX}</button></span>&nbsp;',
                    totalFootNote = editor.getDoc().querySelectorAll('.wiki-fnotepop'),
                    wiki_fnote = editor.getDoc().querySelectorAll('.wiki-fnote'),
                    totalCount = totalFootNote.length,
                    newfootnoteContent = e.data.name,
                    html;
                //var fixContent =  newfootnoteContent.replace(/\"/g,"&quot;")
                //console.log(fixContent)
                var fixFootnoteContent = (function () {
                    return encodeURIComponent(newfootnoteContent)
                    // var fixContent;
                    // if (newfootnoteContent.match('"')) {
                    //     fixContent =  newfootnoteContent.replace(/\"/g,"&quot;");
                    //
                    //     return fixContent;
                    // }
                    //else {
                    //     return newfootnoteContent;
                    // }
                }());

                function findNextFD($node)
                {
                    function nextInDOM(_selector, $node) {
                        var next = getNext($node);

                        while(next.length != 0) {
                            var found = searchFor(_selector, next);
                            if(found != null) {
                                return found;
                            }
                            next = getNext(next);
                        }
                        return next;
                    }
                    function getNext($node) {
                        if($node.nextAll().find('.wiki-fnotepop').length > 0) {
                            if ($node.next().hasClass('wiki-fnotepop')) {
                                return $node.next().children().children();
                            }
                            else {
                                return $node.nextAll().find('.wiki-fnotepop')//.first().text()
                            }

                        }
                        else {
                            if ($node.prop('nodeName') == 'BODY') {
                                return []
                            }
                            return getNext($node.parent());
                        }
                    }
                    function searchFor(_selector, $node) {
                        if (!$node) {return false}
                        if($node) {
                            return $node
                        }
                        else {
                            var found = null;
                            $node.children().each(function() {
                                if ($node)
                                    found = searchFor(_selector, $(this));
                            })
                            return found
                        }
                        return null;
                    }
                    var currentClassNot_NextClass = nextInDOM('.wiki-fnotepop', $node);
                    return currentClassNot_NextClass;
                }

                var nextFD = findNextFD($(editor.selection.getRng().endContainer))

                if(nextFD.length) {
                    nextFD = nextFD[0];
                    var foundIdx;
                    for(foundIdx = 0; foundIdx < totalCount; foundIdx++) {
                        if(nextFD == totalFootNote[foundIdx]) {
                            break;
                        }
                    }
                    //console.log(selectIndex, foundIdx)

                    if (selectIndex < totalCount) {
                        //각주 수정할때
                        html = htmlTemplate.supplant({FOOTNOTE:fixFootnoteContent, FOOTNOTE_INDEX:$(totalFootNote[selectIndex-1]).html()});
                    }
                    else {
                        html = htmlTemplate.supplant({FOOTNOTE:fixFootnoteContent, FOOTNOTE_INDEX:$(totalFootNote[foundIdx]).html()});
                        editor.selection.collapse(0);
                    }

                } else {
                    //마지막에 추가될때
                    html = htmlTemplate.supplant({FOOTNOTE:fixFootnoteContent, FOOTNOTE_INDEX:totalCount + 1});
                    editor.selection.collapse(0);
                }

                editor.execCommand('mceInsertContent', false, html);

                $(editor.getDoc()).find('.wiki-fnotepop').each(function(idx){
                    $(this).text((idx+1));
                    $(this).parent().attr('id','#wk_ft' + (idx +1));
                })
            }

        });
    }

    editor.addCommand('mceFootnotes', showDialog);

    editor.addButton("footnotes", {
        title : '각주',
        image : tinyMCE.baseURL + '/plugins/footnotes/img/footnotes.png',
        onclick: showDialog,
        stateSelector: 'span.wiki-fnote'

    });
});
