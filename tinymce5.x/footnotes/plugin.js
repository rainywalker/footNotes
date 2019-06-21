
(function(){
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    if (typeof Array.prototype.forEach !== 'function') {
        Array.prototype.forEach = function(cb){
          for (var i = 0; i < this.length; i++){
            cb.apply(this, [this[i], i, this]);
          }
        };
    }
    if (Object.defineProperty 
        && Object.getOwnPropertyDescriptor 
        && Object.getOwnPropertyDescriptor(Element.prototype, "textContent") 
        && !Object.getOwnPropertyDescriptor(Element.prototype, "textContent").get) {
        (function() {
          var innerText = Object.getOwnPropertyDescriptor(Element.prototype, "innerText");
          Object.defineProperty(Element.prototype, "textContent",
           {
             get: function() {
               return innerText.get.call(this);
             },
             set: function(s) {
               return innerText.set.call(this, s);
             }
           }
         );
        })();
      }

    
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
                    htmlTemplate = '<span class="fnoteWrap" id="#wk_ft{FOOTNOTE_INDEX}" contenteditable="false"><button type="button" class="fnoteBtn" data-content="'+fixFootnoteContent+'">{FOOTNOTE_INDEX}</button></span>',
                    totalFootNote = editor.getDoc().querySelectorAll('.fnoteBtn'),
                    totalCount = totalFootNote.length,
                    html;
                
                        
                function findNextFD(node) {
                    var getNext = function(el) {

                        var nextAll = false,
                            elements;

                        nextAll = [].filter.call(el.parentNode.children, function (htmlElement) {
                            return (htmlElement.previousElementSibling === el) ? nextAll = true : nextAll;
                        });

                        return nextAll.map(v => {
                            if (Array.from(v.querySelectorAll('fnoteBtn').length) > 0) {
                                
                                $node.nextElementSibling.classList.contains('fnoteBtn') ?
                                    elements =  $node.nextElementSibling.children.children :
                                    elements =  v.querySelectorAll('.fnoteBtn');

                                return elements
                            }
                            else {
                                if (el.nodeName === 'BODY') return [];

                                return getNext(el.parentNode);
                            }
                        })
                    }
                    var nextInDOM = function(_selector, el) {
                        
                        var next = getNext(el);
                        
                        while(next.length !== 0) {
                            var found = searchFor(_selector, next);
                            if(found !== null) {
                                return found;
                            }
                            next = getNext(next);
                        }
                        return next;
                    }

                    
                    var searchFor = function(_selector, el) {
                        if (!el) {return false};
                        if(el) {
                            return $node;
                        }
                        else {
                            var found = null;
                            el.children.forEach(function() {
                                if (el)
                                    found = searchFor(_selector, this);
                            });
                            return found;
                        }
                        return null;
                    }
                    var currentClassNot_NextClass = nextInDOM('.fnoteBtn', node);

                    return currentClassNot_NextClass;
                }
                
                var nextFD = findNextFD(editor.selection.getRng().endContainer);

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
                
                var fnoteBtn = Array.from(editor.getDoc().querySelectorAll('.fnoteBtn'));

                fnoteBtn.forEach(function(value,idx){
                    value.textContent = idx+1;
                    value.parentNode.setAttribute('id','#wk_ft' + (idx +1))
                })
               
            }
        });
    };
    var Dialog = { open: open };
    var register$1 = function (editor) {
        editor.ui.registry.addToggleButton('footnotes', {
            icon : 'fnote',
            tooltip : 'Footnote',
            onAction: function () {

                return editor.execCommand('footnotes');
            },
            onSetup: function (buttonApi) {
                return editor.selection.selectorChangedWithUnbind('span.fnoteWrap', buttonApi.setActive).unbind;
            }
        });
        editor.ui.registry.addMenuItem('footnotes', {
            icon: 'fnote',

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
            editor.ui.registry.addIcon('fnote','<img src="'+ tinyMCE.baseURL + '/plugins/footnotes/img/fn.png' +'">')
            Commands.register(editor);
            Buttons.register(editor);
        });
    }

    Plugin();
})()

