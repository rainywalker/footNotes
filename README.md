# footNotes
tinymce Editor 4.x / 5.x FootNotes Plugin.
> **JQuery is required (tinymce 4.x)**


# Principle

The text entered in the insert contents window is stored in the 'data-content' attribute

````
//html of button inserted in editor
<span id="#wk_ft1" class="fnoteWrap" contenteditable="false" data-mce-selected="1">
    <button class="fnoteBtn" type="button" data-content="the text entered">1</button>
</span>
````

#Usage
    tinymce.init({
      selector: 'textarea',
      plugins: [
        'footnotes'
      ],
      toolbar: 'footnotes',
    });
