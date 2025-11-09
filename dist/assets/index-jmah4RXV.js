(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))i(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const r of o.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&i(r)}).observe(document,{childList:!0,subtree:!0});function e(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function i(n){if(n.ep)return;n.ep=!0;const o=e(n);fetch(n.href,o)}})();/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.21.0
 * @author George Michael Brower
 * @license MIT
 */class g{constructor(t,e,i,n,o="div"){this.parent=t,this.object=e,this.property=i,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement(o),this.domElement.classList.add("lil-controller"),this.domElement.classList.add(n),this.$name=document.createElement("div"),this.$name.classList.add("lil-name"),g.nextNameID=g.nextNameID||0,this.$name.id=`lil-gui-name-${++g.nextNameID}`,this.$widget=document.createElement("div"),this.$widget.classList.add("lil-widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.domElement.addEventListener("keydown",r=>r.stopPropagation()),this.domElement.addEventListener("keyup",r=>r.stopPropagation()),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(i)}name(t){return this._name=t,this.$name.textContent=t,this}onChange(t){return this._onChange=t,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(t=!0){return this.disable(!t)}disable(t=!0){return t===this._disabled?this:(this._disabled=t,this.domElement.classList.toggle("lil-disabled",t),this.$disable.toggleAttribute("disabled",t),this)}show(t=!0){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(t){const e=this.parent.add(this.object,this.property,t);return e.name(this._name),this.destroy(),e}min(t){return this}max(t){return this}step(t){return this}decimals(t){return this}listen(t=!0){return this._listening=t,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const t=this.save();t!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=t}getValue(){return this.object[this.property]}setValue(t){return this.getValue()!==t&&(this.object[this.property]=t,this._callOnChange(),this.updateDisplay()),this}updateDisplay(){return this}load(t){return this.setValue(t),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class M extends g{constructor(t,e,i){super(t,e,i,"lil-boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function E(s){let t,e;return(t=s.match(/(#|0x)?([a-f0-9]{6})/i))?e=t[2]:(t=s.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?e=parseInt(t[1]).toString(16).padStart(2,0)+parseInt(t[2]).toString(16).padStart(2,0)+parseInt(t[3]).toString(16).padStart(2,0):(t=s.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(e=t[1]+t[1]+t[2]+t[2]+t[3]+t[3]),e?"#"+e:!1}const F={isPrimitive:!0,match:s=>typeof s=="string",fromHexString:E,toHexString:E},y={isPrimitive:!0,match:s=>typeof s=="number",fromHexString:s=>parseInt(s.substring(1),16),toHexString:s=>"#"+s.toString(16).padStart(6,0)},D={isPrimitive:!1,match:s=>Array.isArray(s)||ArrayBuffer.isView(s),fromHexString(s,t,e=1){const i=y.fromHexString(s);t[0]=(i>>16&255)/255*e,t[1]=(i>>8&255)/255*e,t[2]=(i&255)/255*e},toHexString([s,t,e],i=1){i=255/i;const n=s*i<<16^t*i<<8^e*i<<0;return y.toHexString(n)}},z={isPrimitive:!1,match:s=>Object(s)===s,fromHexString(s,t,e=1){const i=y.fromHexString(s);t.r=(i>>16&255)/255*e,t.g=(i>>8&255)/255*e,t.b=(i&255)/255*e},toHexString({r:s,g:t,b:e},i=1){i=255/i;const n=s*i<<16^t*i<<8^e*i<<0;return y.toHexString(n)}},R=[F,y,D,z];function V(s){return R.find(t=>t.match(s))}class O extends g{constructor(t,e,i,n){super(t,e,i,"lil-color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=V(this.initialValue),this._rgbScale=n,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const o=E(this.$text.value);o&&this._setValueFromHexString(o)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(t){if(this._format.isPrimitive){const e=this._format.fromHexString(t);this.setValue(e)}else this._format.fromHexString(t,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(t){return this._setValueFromHexString(t),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class S extends g{constructor(t,e,i){super(t,e,i,"lil-function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",n=>{n.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class T extends g{constructor(t,e,i,n,o,r){super(t,e,i,"lil-number"),this._initInput(),this.min(n),this.max(o);const h=r!==void 0;this.step(h?r:this._getImplicitStep(),h),this.updateDisplay()}decimals(t){return this._decimals=t,this.updateDisplay(),this}min(t){return this._min=t,this._onUpdateMinMax(),this}max(t){return this._max=t,this._onUpdateMinMax(),this}step(t,e=!0){return this._step=t,this._stepExplicit=e,this}updateDisplay(){const t=this.getValue();if(this._hasSlider){let e=(t-this._min)/(this._max-this._min);e=Math.max(0,Math.min(e,1)),this.$fill.style.width=e*100+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?t:t.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),window.matchMedia("(pointer: coarse)").matches&&(this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any")),this.$widget.appendChild(this.$input),this.$disable=this.$input;const e=()=>{let l=parseFloat(this.$input.value);isNaN(l)||(this._stepExplicit&&(l=this._snap(l)),this.setValue(this._clamp(l)))},i=l=>{const p=parseFloat(this.$input.value);isNaN(p)||(this._snapClampSetValue(p+l),this.$input.value=this.getValue())},n=l=>{l.key==="Enter"&&this.$input.blur(),l.code==="ArrowUp"&&(l.preventDefault(),i(this._step*this._arrowKeyMultiplier(l))),l.code==="ArrowDown"&&(l.preventDefault(),i(this._step*this._arrowKeyMultiplier(l)*-1))},o=l=>{this._inputFocused&&(l.preventDefault(),i(this._step*this._normalizeMouseWheel(l)))};let r=!1,h,c,d,m,u;const f=5,v=l=>{h=l.clientX,c=d=l.clientY,r=!0,m=this.getValue(),u=0,window.addEventListener("mousemove",w),window.addEventListener("mouseup",b)},w=l=>{if(r){const p=l.clientX-h,_=l.clientY-c;Math.abs(_)>f?(l.preventDefault(),this.$input.blur(),r=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(p)>f&&b()}if(!r){const p=l.clientY-d;u-=p*this._step*this._arrowKeyMultiplier(l),m+u>this._max?u=this._max-m:m+u<this._min&&(u=this._min-m),this._snapClampSetValue(m+u)}d=l.clientY},b=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",w),window.removeEventListener("mouseup",b)},x=()=>{this._inputFocused=!0},a=()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()};this.$input.addEventListener("input",e),this.$input.addEventListener("keydown",n),this.$input.addEventListener("wheel",o,{passive:!1}),this.$input.addEventListener("mousedown",v),this.$input.addEventListener("focus",x),this.$input.addEventListener("blur",a)}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("lil-slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("lil-fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("lil-has-slider");const t=(a,l,p,_,L)=>(a-l)/(p-l)*(L-_)+_,e=a=>{const l=this.$slider.getBoundingClientRect();let p=t(a,l.left,l.right,this._min,this._max);this._snapClampSetValue(p)},i=a=>{this._setDraggingStyle(!0),e(a.clientX),window.addEventListener("mousemove",n),window.addEventListener("mouseup",o)},n=a=>{e(a.clientX)},o=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",o)};let r=!1,h,c;const d=a=>{a.preventDefault(),this._setDraggingStyle(!0),e(a.touches[0].clientX),r=!1},m=a=>{a.touches.length>1||(this._hasScrollBar?(h=a.touches[0].clientX,c=a.touches[0].clientY,r=!0):d(a),window.addEventListener("touchmove",u,{passive:!1}),window.addEventListener("touchend",f))},u=a=>{if(r){const l=a.touches[0].clientX-h,p=a.touches[0].clientY-c;Math.abs(l)>Math.abs(p)?d(a):(window.removeEventListener("touchmove",u),window.removeEventListener("touchend",f))}else a.preventDefault(),e(a.touches[0].clientX)},f=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",u),window.removeEventListener("touchend",f)},v=this._callOnFinishChange.bind(this),w=400;let b;const x=a=>{if(Math.abs(a.deltaX)<Math.abs(a.deltaY)&&this._hasScrollBar)return;a.preventDefault();const p=this._normalizeMouseWheel(a)*this._step;this._snapClampSetValue(this.getValue()+p),this.$input.value=this.getValue(),clearTimeout(b),b=setTimeout(v,w)};this.$slider.addEventListener("mousedown",i),this.$slider.addEventListener("touchstart",m,{passive:!1}),this.$slider.addEventListener("wheel",x,{passive:!1})}_setDraggingStyle(t,e="horizontal"){this.$slider&&this.$slider.classList.toggle("lil-active",t),document.body.classList.toggle("lil-dragging",t),document.body.classList.toggle(`lil-${e}`,t)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(t){let{deltaX:e,deltaY:i}=t;return Math.floor(t.deltaY)!==t.deltaY&&t.wheelDelta&&(e=0,i=-t.wheelDelta/120,i*=this._stepExplicit?1:10),e+-i}_arrowKeyMultiplier(t){let e=this._stepExplicit?1:10;return t.shiftKey?e*=10:t.altKey&&(e/=10),e}_snap(t){let e=0;return this._hasMin?e=this._min:this._hasMax&&(e=this._max),t-=e,t=Math.round(t/this._step)*this._step,t+=e,t=parseFloat(t.toPrecision(15)),t}_clamp(t){return t<this._min&&(t=this._min),t>this._max&&(t=this._max),t}_snapClampSetValue(t){this.setValue(this._clamp(this._snap(t)))}get _hasScrollBar(){const t=this.parent.root.$children;return t.scrollHeight>t.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class H extends g{constructor(t,e,i,n){super(t,e,i,"lil-option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("lil-display"),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("lil-focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("lil-focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.options(n)}options(t){return this._values=Array.isArray(t)?t:Object.values(t),this._names=Array.isArray(t)?t:Object.keys(t),this.$select.replaceChildren(),this._names.forEach(e=>{const i=document.createElement("option");i.textContent=e,this.$select.appendChild(i)}),this.updateDisplay(),this}updateDisplay(){const t=this.getValue(),e=this._values.indexOf(t);return this.$select.selectedIndex=e,this.$display.textContent=e===-1?t:this._names[e],this}}class P extends g{constructor(t,e,i){super(t,e,i,"lil-string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("spellcheck","false"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",n=>{n.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}var I=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.lil-root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.lil-root > .lil-children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.lil-root > .lil-children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.lil-allow-touch-styles, .lil-gui.lil-allow-touch-styles .lil-gui {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.lil-force-touch-styles, .lil-gui.lil-force-touch-styles .lil-gui {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.lil-auto-place, .lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-controller.lil-disabled {
  opacity: 0.5;
}
.lil-controller.lil-disabled, .lil-controller.lil-disabled * {
  pointer-events: none !important;
}
.lil-controller > .lil-name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-controller .lil-widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-controller.lil-string input {
  color: var(--string-color);
}
.lil-controller.lil-boolean {
  cursor: pointer;
}
.lil-controller.lil-color .lil-display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-controller.lil-color .lil-display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-controller.lil-color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-controller.lil-color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-controller.lil-option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-controller.lil-option .lil-display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-display.lil-focus {
    background: var(--focus-color);
  }
}
.lil-controller.lil-option .lil-display.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-option .lil-display:after {
  font-family: "lil-gui";
  content: "↕";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-controller.lil-option .lil-widget,
.lil-controller.lil-option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-controller.lil-option .lil-widget:hover .lil-display {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number input {
  color: var(--number-color);
}
.lil-controller.lil-number.lil-has-slider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-controller.lil-number .lil-slider {
  width: 100%;
  height: var(--widget-height);
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-controller.lil-number .lil-slider:hover {
    background: var(--hover-color);
  }
}
.lil-controller.lil-number .lil-slider.lil-active {
  background: var(--focus-color);
}
.lil-controller.lil-number .lil-slider.lil-active .lil-fill {
  opacity: 0.95;
}
.lil-controller.lil-number .lil-fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-dragging * {
  cursor: ew-resize !important;
}
.lil-dragging.lil-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .lil-title {
  height: var(--title-height);
  font-weight: 600;
  padding: 0 var(--padding);
  width: 100%;
  text-align: left;
  background: none;
  text-decoration-skip: objects;
}
.lil-gui .lil-title:before {
  font-family: "lil-gui";
  content: "▾";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .lil-title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-dragging) .lil-gui .lil-title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .lil-title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.lil-root > .lil-title:focus {
  text-decoration: none !important;
}
.lil-gui.lil-closed > .lil-title:before {
  content: "▸";
}
.lil-gui.lil-closed > .lil-children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.lil-closed:not(.lil-transition) > .lil-children {
  display: none;
}
.lil-gui.lil-transition > .lil-children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .lil-children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.lil-root > .lil-children > .lil-gui > .lil-title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.lil-root > .lil-children > .lil-gui.lil-closed > .lil-title {
  border-bottom-color: transparent;
}
.lil-gui + .lil-controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .lil-title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .lil-children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .lil-controller {
  border: none;
}

.lil-gui label, .lil-gui input, .lil-gui button {
  -webkit-tap-highlight-color: transparent;
}
.lil-gui input {
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
  -moz-appearance: textfield;
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input[type=checkbox] {
  appearance: none;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "✓";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  border: none;
}
.lil-gui .lil-controller button {
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
}
@media (hover: hover) {
  .lil-gui .lil-controller button:hover {
    background: var(--hover-color);
  }
  .lil-gui .lil-controller button:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui .lil-controller button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff2;charset=utf-8;base64,d09GMgABAAAAAALkAAsAAAAABtQAAAKVAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACDMgqBBIEbATYCJAMUCwwABCAFhAoHgQQbHAbIDiUFEYVARAAAYQTVWNmz9MxhEgodq49wYRUFKE8GWNiUBxI2LBRaVnc51U83Gmhs0Q7JXWMiz5eteLwrKwuxHO8VFxUX9UpZBs6pa5ABRwHA+t3UxUnH20EvVknRerzQgX6xC/GH6ZUvTcAjAv122dF28OTqCXrPuyaDER30YBA1xnkVutDDo4oCi71Ca7rrV9xS8dZHbPHefsuwIyCpmT7j+MnjAH5X3984UZoFFuJ0yiZ4XEJFxjagEBeqs+e1iyK8Xf/nOuwF+vVK0ur765+vf7txotUi0m3N0m/84RGSrBCNrh8Ee5GjODjF4gnWP+dJrH/Lk9k4oT6d+gr6g/wssA2j64JJGP6cmx554vUZnpZfn6ZfX2bMwPPrlANsB86/DiHjhl0OP+c87+gaJo/gY084s3HoYL/ZkWHTRfBXvvoHnnkHvngKun4KBE/ede7tvq3/vQOxDXB1/fdNz6XbPdcr0Vhpojj9dG+owuSKFsslCi1tgEjirjXdwMiov2EioadxmqTHUCIwo8NgQaeIasAi0fTYSPTbSmwbMOFduyh9wvBrESGY0MtgRjtgQR8Q1bRPohn2UoCRZf9wyYANMXFeJTysqAe0I4mrherOekFdKMrYvJjLvOIUM9SuwYB5DVZUwwVjJJOaUnZCmcEkIZZrKqNvRGRMvmFZsmhP4VMKCSXBhSqUBxgMS7h0cZvEd71AWkEhGWaeMFcNnpqyJkyXgYL7PQ1MoSq0wDAkRtJIijkZSmqYTiSImfLiSWXIZwhRh3Rug2X0kk1Dgj+Iu43u5p98ghopcpSo0Uyc8SnjlYX59WUeaMoDqmVD2TOWD9a4pCRAzf2ECgwGcrHjPOWY9bNxq/OL3I/QjwEAAAA=") format("woff2");
}`;function B(s){const t=document.createElement("style");t.innerHTML=s;const e=document.querySelector("head link[rel=stylesheet], head style");e?document.head.insertBefore(t,e):document.head.appendChild(t)}let k=!1;class C{constructor({parent:t,autoPlace:e=t===void 0,container:i,width:n,title:o="Controls",closeFolders:r=!1,injectStyles:h=!0,touchStyles:c=!0}={}){if(this.parent=t,this.root=t?t.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("button"),this.$title.classList.add("lil-title"),this.$title.setAttribute("aria-expanded",!0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("lil-children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(o),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add("lil-root"),c&&this.domElement.classList.add("lil-allow-touch-styles"),!k&&h&&(B(I),k=!0),i?i.appendChild(this.domElement):e&&(this.domElement.classList.add("lil-auto-place","autoPlace"),document.body.appendChild(this.domElement)),n&&this.domElement.style.setProperty("--width",n+"px"),this._closeFolders=r}add(t,e,i,n,o){if(Object(i)===i)return new H(this,t,e,i);const r=t[e];switch(typeof r){case"number":return new T(this,t,e,i,n,o);case"boolean":return new M(this,t,e);case"string":return new P(this,t,e);case"function":return new S(this,t,e)}console.error(`gui.add failed
	property:`,e,`
	object:`,t,`
	value:`,r)}addColor(t,e,i=1){return new O(this,t,e,i)}addFolder(t){const e=new C({parent:this,title:t});return this.root._closeFolders&&e.close(),e}load(t,e=!0){return t.controllers&&this.controllers.forEach(i=>{i instanceof S||i._name in t.controllers&&i.load(t.controllers[i._name])}),e&&t.folders&&this.folders.forEach(i=>{i._title in t.folders&&i.load(t.folders[i._title])}),this}save(t=!0){const e={controllers:{},folders:{}};return this.controllers.forEach(i=>{if(!(i instanceof S)){if(i._name in e.controllers)throw new Error(`Cannot save GUI with duplicate property "${i._name}"`);e.controllers[i._name]=i.save()}}),t&&this.folders.forEach(i=>{if(i._title in e.folders)throw new Error(`Cannot save GUI with duplicate folder "${i._title}"`);e.folders[i._title]=i.save()}),e}open(t=!0){return this._setClosed(!t),this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("lil-closed",this._closed),this}close(){return this.open(!1)}_setClosed(t){this._closed!==t&&(this._closed=t,this._callOnOpenClose(this))}show(t=!0){return this._hidden=!t,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(t=!0){return this._setClosed(!t),this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const e=this.$children.clientHeight;this.$children.style.height=e+"px",this.domElement.classList.add("lil-transition");const i=o=>{o.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("lil-transition"),this.$children.removeEventListener("transitionend",i))};this.$children.addEventListener("transitionend",i);const n=t?this.$children.scrollHeight:0;this.domElement.classList.toggle("lil-closed",!t),requestAnimationFrame(()=>{this.$children.style.height=n+"px"})}),this}title(t){return this._title=t,this.$title.textContent=t,this}reset(t=!0){return(t?this.controllersRecursive():this.controllers).forEach(i=>i.reset()),this}onChange(t){return this._onChange=t,this}_callOnChange(t){this.parent&&this.parent._callOnChange(t),this._onChange!==void 0&&this._onChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t})}onFinishChange(t){return this._onFinishChange=t,this}_callOnFinishChange(t){this.parent&&this.parent._callOnFinishChange(t),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:t.object,property:t.property,value:t.getValue(),controller:t})}onOpenClose(t){return this._onOpenClose=t,this}_callOnOpenClose(t){this.parent&&this.parent._callOnOpenClose(t),this._onOpenClose!==void 0&&this._onOpenClose.call(this,t)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(t=>t.destroy())}controllersRecursive(){let t=Array.from(this.controllers);return this.folders.forEach(e=>{t=t.concat(e.controllersRecursive())}),t}foldersRecursive(){let t=Array.from(this.folders);return this.folders.forEach(e=>{t=t.concat(e.foldersRecursive())}),t}}function U(s="World"){let t=document.getElementById(s);return t||(t=document.createElement("div"),t.id=s,Object.assign(t.style,{position:"fixed",inset:"0",width:"100vw",height:"100vh",zIndex:"0",overflow:"hidden"}),document.body.prepend(t),t)}function Y(){const s=document.createElement("button");return s.innerHTML=`
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
        </svg>
    `,Object.assign(s.style,{position:"absolute",bottom:"16px",right:"16px",padding:"12px",background:"rgba(0, 0, 0, 0.6)",border:"none",borderRadius:"8px",color:"white",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"background 0.2s",zIndex:"1000",backdropFilter:"blur(4px)"}),s.addEventListener("mouseenter",()=>{s.style.background="rgba(0, 0, 0, 0.8)"}),s.addEventListener("mouseleave",()=>{s.style.background="rgba(0, 0, 0, 0.6)"}),s}const j=`#version 300 es
in vec2 position;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
}
`;function X(s,t=""){return`#version 300 es
precision highp float;

uniform vec3  iResolution;
uniform float iTime;
uniform int   iFrame;
uniform vec4  iMouse;
uniform vec4  iDate;

${t}

out vec4 outColor;

${s}

void main() {
    vec4 color;
    mainImage(color, gl_FragCoord.xy);
    outColor = color;
}
`}function A(s,t,e){const i=s.createShader(t);if(s.shaderSource(i,e),s.compileShader(i),!s.getShaderParameter(i,s.COMPILE_STATUS)){const n=s.getShaderInfoLog(i);throw s.deleteShader(i),new Error(`Shader compilation failed: ${n}`)}return i}function G(s,t,e){const i=A(s,s.VERTEX_SHADER,t),n=A(s,s.FRAGMENT_SHADER,e),o=s.createProgram();if(s.attachShader(o,i),s.attachShader(o,n),s.linkProgram(o),!s.getProgramParameter(o,s.LINK_STATUS)){const r=s.getProgramInfoLog(o);throw new Error(`Program linking failed: ${r}`)}return s.deleteShader(i),s.deleteShader(n),o}class q{constructor(t,e={}){const{container:i,containerId:n="World",fullscreen:o=!0,createUI:r=!0,showFullscreenButton:h=!1,viewportScale:c=1,transparent:d=!0,maxDPR:m=2,targetFPS:u=60}=e;if(this.container=i??(o?U(n):document.body),this.container.style.position="relative",this.wrapper=document.createElement("div"),Object.assign(this.wrapper.style,{position:"relative",width:"100%",height:"100%"}),this.container.appendChild(this.wrapper),this.canvas=document.createElement("canvas"),this.canvas.style.display="block",this.canvas.style.width="100%",this.canvas.style.height="100%",this.wrapper.appendChild(this.canvas),this.fullscreenButton=null,h&&(this.fullscreenButton=Y(),this.wrapper.appendChild(this.fullscreenButton),this._bindFullscreen()),this.gl=this.canvas.getContext("webgl2",{antialias:!0,alpha:d,preserveDrawingBuffer:!0,premultipliedAlpha:!1,powerPreference:"high-performance"}),!this.gl)throw new Error("WebGL2 not supported");this.dpr=Math.min(window.devicePixelRatio||1,m),this.transparent=d,this.viewportScale=Math.max(.1,Math.min(1,c));const f=new Float32Array([-1,-1,1,-1,-1,1,1,1]);this.vao=this.gl.createVertexArray(),this.vbo=this.gl.createBuffer(),this.gl.bindVertexArray(this.vao),this.gl.bindBuffer(this.gl.ARRAY_BUFFER,this.vbo),this.gl.bufferData(this.gl.ARRAY_BUFFER,f,this.gl.STATIC_DRAW),this.gui=r?new C:null,this._fragBody=t||"void mainImage(out vec4 fragColor, in vec2 fragCoord){ fragColor = vec4(0.0); }",this._customUniforms=[],this._uniformLocations={},this._uniformValues={iResolution:[1,1,1],iTime:0,iFrame:0,iMouse:[0,0,0,0],iDate:[0,0,0,0]},this._buildProgram(),this._animating=!1,this._targetFPS=u,this._startTimeMs=performance.now(),this._lastRAF=0,this._isMouseDown=!1,this._mouse={x:0,y:0,clickX:0,clickY:0},this._bindMouse(),this._onWindowResize=()=>this.resize(),window.addEventListener("resize",this._onWindowResize),this._ro=new ResizeObserver(()=>this.resize()),this._ro.observe(this.container),this.resize(),requestAnimationFrame(()=>this.resize())}_buildProgram(){const t=this._customUniforms.map(n=>`uniform ${n.glslType} ${n.name};`).join(`
`),e=X(this._fragBody,t);this.program&&this.gl.deleteProgram(this.program),this.program=G(this.gl,j,e);const i=this.gl.getAttribLocation(this.program,"position");this.gl.enableVertexAttribArray(i),this.gl.vertexAttribPointer(i,2,this.gl.FLOAT,!1,0,0),this._uniformLocations={iResolution:this.gl.getUniformLocation(this.program,"iResolution"),iTime:this.gl.getUniformLocation(this.program,"iTime"),iFrame:this.gl.getUniformLocation(this.program,"iFrame"),iMouse:this.gl.getUniformLocation(this.program,"iMouse"),iDate:this.gl.getUniformLocation(this.program,"iDate")};for(const n of this._customUniforms)this._uniformLocations[n.name]=this.gl.getUniformLocation(this.program,n.name)}addUniform(t,e,i){return this._customUniforms.push({name:t,glslType:e}),e==="vec2"?this._uniformValues[t]=Array.isArray(i)?i:[i,i]:e==="vec3"?this._uniformValues[t]=Array.isArray(i)?i:[i,i,i]:e==="vec4"?this._uniformValues[t]=Array.isArray(i)?i:[i,i,i,i]:this._uniformValues[t]=i,this._buildProgram(),this}addControl(t,e={}){if(!this.gui)return console.warn("GUI not enabled"),this;const i=this._uniformValues[t];if(i===void 0)return console.warn(`Uniform '${t}' not found`),this;if(e.type==="color"&&Array.isArray(i)&&i.length===3){const n={color:`#${i.map(o=>Math.round(o*255).toString(16).padStart(2,"0")).join("")}`};this.gui.addColor(n,"color").name(e.name||t).onChange(o=>{const r=parseInt(o.slice(1,3),16)/255,h=parseInt(o.slice(3,5),16)/255,c=parseInt(o.slice(5,7),16)/255;this._uniformValues[t]=[r,h,c]})}else if(Array.isArray(i)){const n=this.gui.addFolder(e.name||t),o=["x","y","z","w"].slice(0,i.length),r={};o.forEach((h,c)=>{r[h]=i[c],n.add(r,h,e.min??-10,e.max??10,e.step).onChange(d=>{this._uniformValues[t][c]=d})})}else if(typeof i=="number"){const n={value:i};this.gui.add(n,"value",e.min??-10,e.max??10,e.step).name(e.name||t).onChange(o=>{this._uniformValues[t]=o})}else if(typeof i=="boolean"){const n={value:i};this.gui.add(n,"value").name(e.name||t).onChange(o=>{this._uniformValues[t]=o})}return this}setViewportScale(t){this.viewportScale=Math.max(.1,Math.min(1,t)),this.resize()}start(){if(this._animating)return;this._animating=!0,this._startTimeMs=performance.now();const t=e=>{if(!this._animating)return;const i=1e3/Math.max(1,Math.min(240,this._targetFPS|0));if(e-this._lastRAF>=i){const n=performance.now();this._uniformValues.iTime=(n-this._startTimeMs)/1e3,this._uniformValues.iFrame=(this._uniformValues.iFrame|0)+1,this._updateIDate(),this.render(),this._lastRAF=e}requestAnimationFrame(t)};requestAnimationFrame(t)}stop(){this._animating=!1,this._uniformValues.iFrame=0}render(){const t=this.gl;t.viewport(0,0,this.canvas.width,this.canvas.height),t.clearColor(0,0,0,this.transparent?0:1),t.clear(t.COLOR_BUFFER_BIT),t.useProgram(this.program),t.bindVertexArray(this.vao),this._uniformValues.iResolution=[this.canvas.width,this.canvas.height,1],t.uniform3fv(this._uniformLocations.iResolution,this._uniformValues.iResolution),t.uniform1f(this._uniformLocations.iTime,this._uniformValues.iTime),t.uniform1i(this._uniformLocations.iFrame,this._uniformValues.iFrame),t.uniform4fv(this._uniformLocations.iMouse,this._uniformValues.iMouse),t.uniform4fv(this._uniformLocations.iDate,this._uniformValues.iDate);for(const e of this._customUniforms){const i=this._uniformLocations[e.name],n=this._uniformValues[e.name];e.glslType==="float"?t.uniform1f(i,n):e.glslType==="int"?t.uniform1i(i,n):e.glslType==="bool"?t.uniform1i(i,n?1:0):e.glslType==="vec2"?t.uniform2fv(i,n):e.glslType==="vec3"?t.uniform3fv(i,n):e.glslType==="vec4"&&t.uniform4fv(i,n)}t.drawArrays(t.TRIANGLE_STRIP,0,4)}resize(t,e){const i=Math.max(1,Math.round(t??(this.container.clientWidth||window.innerWidth))),n=Math.max(1,Math.round(e??(this.container.clientHeight||window.innerHeight))),o=Math.round(i*this.viewportScale),r=Math.round(n*this.viewportScale);this.canvas.width=o*this.dpr,this.canvas.height=r*this.dpr,this.canvas.style.width=`${o}px`,this.canvas.style.height=`${r}px`,this.canvas.style.position="absolute",this.canvas.style.left=`${(i-o)/2}px`,this.canvas.style.top=`${(n-r)/2}px`,this.canvas.style.transform="none"}setShaderSource(t){this._fragBody=t,this._buildProgram()}toggleFullscreen(){var t,e,i,n,o,r,h,c,d;document.fullscreenElement?(h=document.exitFullscreen)!=null&&h.call(document)||(c=document.webkitExitFullscreen)!=null&&c.call(document)||((d=document.mozCancelFullScreen)==null||d.call(document)):(e=(t=this.container).requestFullscreen)!=null&&e.call(t)||(n=(i=this.container).webkitRequestFullscreen)!=null&&n.call(i)||((r=(o=this.container).mozRequestFullScreen)==null||r.call(o))}_bindFullscreen(){if(!this.fullscreenButton)return;this.fullscreenButton.addEventListener("click",()=>this.toggleFullscreen());const t=()=>{const e=!!document.fullscreenElement;this.fullscreenButton.innerHTML=e?`
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/>
                </svg>
            `:`
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
            `};document.addEventListener("fullscreenchange",t),document.addEventListener("webkitfullscreenchange",t),document.addEventListener("mozfullscreenchange",t)}dispose(){var t,e,i;this.stop(),(t=this._ro)==null||t.disconnect(),window.removeEventListener("resize",this._onWindowResize),this.canvas.removeEventListener("mousemove",this._onMouseMove),this.canvas.removeEventListener("mousedown",this._onMouseDown),this.canvas.removeEventListener("mouseup",this._onMouseUp),this.gl.deleteBuffer(this.vbo),this.gl.deleteVertexArray(this.vao),this.gl.deleteProgram(this.program),(e=this.canvas)!=null&&e.parentNode&&this.canvas.parentNode.removeChild(this.canvas),(i=this.gui)==null||i.destroy()}_updateIDate(){const t=new Date,e=t.getHours()*3600+t.getMinutes()*60+t.getSeconds()+t.getMilliseconds()/1e3;this._uniformValues.iDate=[t.getFullYear(),t.getMonth()+1,t.getDate(),e]}_bindMouse(){this._onMouseMove=t=>{this._isMouseDown&&this._updateMouse(t,!1)},this._onMouseDown=t=>{this._isMouseDown=!0,this._updateMouse(t,!0)},this._onMouseUp=t=>{this._isMouseDown=!1,this._updateMouse(t,!1)},this.canvas.addEventListener("mousemove",this._onMouseMove),this.canvas.addEventListener("mousedown",this._onMouseDown),this.canvas.addEventListener("mouseup",this._onMouseUp)}_updateMouse(t,e){const i=this.canvas.getBoundingClientRect(),n=this.canvas.width,o=this.canvas.height,r=n*this.viewportScale,h=o*this.viewportScale,c=(n-r)*.5,d=(o-h)*.5,m=(t.clientX-i.left)*this.dpr,u=(i.bottom-t.clientY)*this.dpr,f=m-c,v=u-d;e&&(this._mouse.clickX=f,this._mouse.clickY=v),this._mouse.x=f,this._mouse.y=v,this._uniformValues.iMouse=[this._mouse.x,this._mouse.y,this._mouse.clickX,this._mouse.clickY]}}const W=`
bool eventHorizon;
float M;
vec3 bhPos;

//a position and velocity
struct state{
    vec3 pos;
    vec3 dir;
};


//derivative of initial condition: velocity and acceleration
struct dState{
    vec3 vel;
    vec3 acc;
};


//adding velocity /acceleration pairs
dState add(dState s1,dState s2){
    vec3 vel=s1.vel+s2.vel;
    vec3 acc=s1.acc+s2.acc;
    dState sum;
    sum.vel=vel;
    sum.acc=acc;
    return sum;
}



//scaling an acceleration /velocity pair
dState scale(dState dS,float k){
    dS.vel*=k;
    dS.acc*=k;
    return dS;
}


//evolve a state in time by dS for size stp
state nudge(state S, dState dS,float stp){
    S.pos+=dS.vel*stp;
    S.dir+=dS.acc*stp;
    return S;
}





//this is the function which sets up the dynamics for the system
//can put any 2nd order ODE in here
dState stateDeriv(state S){

    //translate by black hole position
    vec3 r=S.pos-bhPos;
    vec3 v=S.dir;

    dState dS;
    //copy over velocity: the equation below
    //is a trajectory of the form x''=f(x) so this is the standard
    //trick to turnr it into a system of first order equations
    dS.vel=v;

    //now compute acceleration:


    //the schwarzschild solution is time invarirant, so, we are focused on
    //drawing the view of an observer stationary w.r.t. coordinates,
    //we can project off the time direction, and look at the projection of
    //lightlike geodesics onto xyz space slices of constant time.

    //different coordinate systems give different ODES: schwarzchild coordinates
    //give a system with coordinate singularities at the event horizon AND pole phi=0 axis
    //instead, we convert to a system of eqns in XYZ coords

    //things turn out after some work to be quite simple: each trajectory has a constnat
    //of motion: angular momentum L.  For that fixed L, we can write an ODE for the trajectory
    //in terms of a force field F_L(x) on RR^3: that is, projections of timelike geodesics
    //solve x''(t)=F_L(x(t)) (this is not a real force, just a way to think about this ODE)
    //this acceleration is F_L(x)=-(3/2 M L^2/R^5)*(x,y,z)
    //where R is the length of xyz

    float R=length(r);

    vec3 l=cross(r,v);
    float L=length(l);

    float mag=3./2.*M*L*L/(R*R*R*R*R);

    //set the acceleration
    dS.acc=-mag*r;
    //dS.acc=vec3(0.);
    return dS;

}




void euler(inout state S,float dt){

    dState dS;
    dS=stateDeriv(S);
    S=nudge(S,dS,dt);
}





void rk4(inout state S,float dt){
    //constants computed during the process
    dState k1,k2,k3,k4;
    state tempS;

    //get the derivative
    k1=stateDeriv(S);
    k1=scale(k1,dt);

    //move the point a little
    tempS=nudge(S,k1,0.5);
    k2=stateDeriv(tempS);
    k2=scale(k2,dt);

    //get k3
    tempS=nudge(S,k2,0.5);
    k3=stateDeriv(tempS);
    k3=scale(k3,dt);

    //get k4
    tempS=nudge(S,k3,1.);
    k4=stateDeriv(tempS);
    k4=scale(k4,dt);

    //add up results:
    dState total=scale(k1,1.);
    total=add(total,scale(k2,2.));
    total=add(total,scale(k3,2.));
    total=add(total,k4);
    total=scale(total,1./6.);

    //the state S has been reset to the endpoint;
    S=nudge(S,total,1.);

}




//make the step size adaptive so it is only small //
//near the black hole, and then again as you approach
// the scene boundary as a cheap way to not overshoot
float setDT(state S){

    float dt,R,bhDT,sceneDT;
    float sceneRad=50.;//radius of outer sphere;
    float planeOffset=50.;//how far back the plane is

    //distance to the black hole:
    R=length(S.pos-bhPos)-2.*M;
    //set step size to large if far from black hole, and small if close
    if(R>5.){bhDT=1.;}
    else{bhDT=(R/5.)*(R/5.)*0.5+0.01;}
    //  bhDT=max(R/2.,0.001);


    //shrink when you approach the boundary
    //so you don't massively overstep it

    //this is for a sphere of radius sceneRad
    //R=sceneRad-length(S.pos);

    //this is for a plane at z=-planeOffset
    R=S.pos.z+planeOffset;


    //this is for a cylinder of radius same as sphere:
    //R=sceneRad-length(S.pos.xz);

    sceneDT=max(R/2.,0.001);

    dt=min(bhDT,sceneDT);
    dt=min(1.,dt);

    return dt;


}



void trace(inout state S){

    float dt;

    //iteratively step through rk4
    for(int n=0;n<350;n++){

        //setting some sort of adaptive dt
        dt=setDT(S);

        //do a step of rk4
        //euler(S,dt);
        rk4(S,dt);

        //if you hit the event horizon, stop.
        if(length(S.pos-bhPos)<2.*M){
            eventHorizon=true;
            break;
        }

        //if you pass the back plane stop
        if(S.pos.z<-49.5){break;}
    }

}



vec4 gridlines(state S,float size){
    float x=mod(S.pos.x/size+iTime/2.,2.);
    float y=mod(S.pos.y/size,2.);
    vec3 color;


    color=vec3(1.);

    float mag=clamp(10./(50.*x*(2.-x)*y*(2.-y)),0.,10.);

    color*=mag;



    return vec4(color,1.);
}


vec4 checkerboard(state S,float size){
    float x=mod(S.pos.x/size+iTime/2.,2.);
    float y=mod(S.pos.y/size,2.);
    vec3 color;


    //if you hit the plane in front of us
    if(S.dir.z<0.){

        color=vec3(0.);
        if(y<1.&&x<1.||y>1.&&x>1.)
        {color=vec3(1.);}

    }


    //if you turn around and hit the plane behind us!
    if(S.dir.z>0.){

        color=vec3(0.,0.,0.);
        if(y<1.&&x<1.||y>1.&&x>1.)
        {color=vec3(1,0,0);}

    }
    //rescale color brightness by distance along xy plane (ie the z component of direction):
    // color*=clamp(abs(2.*S.dir.z),0.,1.);


    return vec4(color,1.);
}


vec4 sphGrid(state S){
    vec3 color=vec3(166./255.,24./255.,2./255.);;
    float numGrids=30.;

    float theta=atan(S.dir.z,S.dir.x)+iTime/40.;
    float phi=acos(S.dir.y);

    float x=mod(numGrids*theta/6.28,2.);
    float y=mod(numGrids*phi/6.28,2.);


    float mag=clamp(10./(50.*x*(2.-x)*y*(2.-y)),0.,10.);

    color*=mag;


    //if instead you want a checkerboard:
    color=vec3(0.);
    if(y<1.&&x<1.||y>1.&&x>1.){color=vec3(1.);}



    return vec4(color,1.);
}



vec4 cylGrid(state S){
    vec3 color=vec3(166./255.,24./255.,2./255.);;
    float numGrids=20.;

    float theta=atan(S.dir.z,S.dir.x)+iTime/20.;
    float z=acos(S.dir.y);

    float x=mod(numGrids*theta/6.28,2.);
    float y=mod(numGrids*z/6.28,2.);


    //if instead you want a checkerboard:
    color=vec3(0.);
    if(y<1.&&x<1.||y>1.&&x>1.){color=vec3(1.);}


    return vec4(color,1.);
}

/**
 * Return the normalized direction to march in from the eye point for a single pixel.
 *
 * fieldOfView: vertical field of view in degrees
 * size: resolution of the output image
 * fragCoord: the x,y coordinate of the pixel in the output image
 */
vec3 rayDirection(float fieldOfView, vec2 size, vec2 fragCoord) {
    vec2 xy = fragCoord - size / 2.0;
    float z = size.y / tan(radians(fieldOfView) / 2.0);
    return normalize(vec3(xy, -z));
}


//intial starting location of your eye (should be along z axis).
vec3 eyePosition(float time){
    return vec3(0.,0.,10.);
    //return vec3(15.*cos(time),0,30.*sin(time));
}


vec3 bhPosition(float time){
    return vec3(15.*cos(time),0,30.*sin(time));
}



void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    eventHorizon=false;

    //set the initial state
    vec3 dir = rayDirection(90.0, iResolution.xy, fragCoord);
    vec3 eye = eyePosition(iTime);
    state S=state(eye,dir);

    //set the black hole's mass:
    M=3.;

    //set the black hole's position:
    bhPos=bhPosition(iTime/2.);

    //do the actual raytracing
    trace(S);
    if(eventHorizon){
        fragColor=vec4(0.);
        return;
    }

    //else, make the color
    vec4 color;
    // color=sphGrid(S);}
    color=checkerboard(S,8.);
    // color=cylGrid(S);



    fragColor = color;
}
`,$=new q(W,{viewportScale:.5,showFullscreenButton:!0,createUI:!0}),N={scale:.5};$.gui.add(N,"scale",.25,1,.25).name("Viewport Size").onChange(s=>$.setViewportScale(s));$.start();
