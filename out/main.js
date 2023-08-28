"use strict";var A=Object.create;var p=Object.defineProperty;var I=Object.getOwnPropertyDescriptor;var B=Object.getOwnPropertyNames;var $=Object.getPrototypeOf,k=Object.prototype.hasOwnProperty;var D=(e,o)=>{for(var n in o)p(e,n,{get:o[n],enumerable:!0})},C=(e,o,n,s)=>{if(o&&typeof o=="object"||typeof o=="function")for(let a of B(o))!k.call(e,a)&&a!==n&&p(e,a,{get:()=>o[a],enumerable:!(s=I(o,a))||s.enumerable});return e};var J=(e,o,n)=>(n=e!=null?A($(e)):{},C(o||!e||!e.__esModule?p(n,"default",{value:e,enumerable:!0}):n,e)),N=e=>C(p({},"__esModule",{value:!0}),e);var U={};D(U,{activate:()=>O,deactivate:()=>L});module.exports=N(U);var t=J(require("vscode")),u,i="",l=!1,c;function f(e){u.text=`${l?"\u{1F535}":""} ${e}`}function M(e){let n=t.workspace.getConfiguration("findAndJump").get(e);if(n===void 0){let s=`Missing config value for ${e}`;throw v(s,"error"),new Error(s)}return n}var R=t.window.createTextEditorDecorationType({backgroundColor:{id:"myExtension.searchHighlight"}});function v(e,o="default"){switch(o){case"default":{t.window.showInformationMessage(e);break}case"error":{t.window.showErrorMessage(e);break}default:throw new Error(`Unkown tooltip type: ${o}`)}}function b(){f("Search mode activate")}function T(e){l=e,t.commands.executeCommand("setContext","findAndJump.isSearchModeActive",e)}function P(){u=t.window.createStatusBarItem(t.StatusBarAlignment.Left,100),u.command="findAndJump.exitSearchMode",u.tooltip="Click to exit search mode.",u.show(),f("Extension activated")}function y({matchIndex:e,searchTerm:o,document:n}){if(typeof e>"u")throw v("Something went wrong. See logs for more information. Error: Missing match index"),new Error("Missing match index");let s=n.positionAt(e),a=n.positionAt(e+o.length);return new t.Range(s,a)}function O(e){console.debug("Activated"),P();let o=t.commands.registerCommand("findAndJump.activateSearchMode",()=>{console.debug("Command: activateSearchMode"),l||(T(!0),b())}),n=t.commands.registerCommand("type",d=>{console.debug("Command: type"),l?(i+=d.text,E(i)):t.commands.executeCommand("default:type",d)}),s=t.commands.registerCommand("findAndJump.captureBackspace",()=>{console.debug("Command: captureBackspace"),l&&(i.length>0&&(i=i.slice(0,-1)),i.length>0?E(i):b())}),a=t.commands.registerCommand("findAndJump.exitSearchMode",()=>{console.debug("Command: exitSearchMode"),z()}),x=t.commands.registerCommand("findAndJump.cycleThroughMatches",()=>{if(console.debug("Command: cycleThroughMatches"),!c)throw new Error("Missing search context");let d=(c.currentIndex+1)%c.matches.length;c.currentIndex=d;let h=c.matches.at(c.currentIndex),r=t.window.activeTextEditor;if(r){let m=y({matchIndex:h,searchTerm:c.searchTerm,document:r.document});r.selection=new t.Selection(m.start,m.end),r.revealRange(m,t.TextEditorRevealType.InCenter)}else throw new Error("No active text editor")});e.subscriptions.push(u,o,n,x,s,a)}function E(e){console.debug("######## Executing search for: ",e);let o=t.window.activeTextEditor;if(!o){v("No active text editor.","error");return}let s=o.document.getText(),x=!!M("caseSensitiveSearch")===!0?"g":"gi",d=new RegExp(e,x),h=Array.from(s.matchAll(d),g=>g.index),r=h.length,m=`Searching for: '${e}'`;if(r===0){c?.searchTerm&&(c.searchTerm=e),f(`${m} | No matches`),M("showTooltipIfNoMatches")&&v(`No matches found for ${e}.`);return}else f(`${m} | ${r} match${r===1?"":"es | Press TAB to cycle through"}`);let S=h.filter(g=>typeof g=="number").map(g=>({range:y({matchIndex:g,searchTerm:e,document:o.document})})),w=S.at(0);w&&(o.selection=new t.Selection(w.range.start,w.range.end),o.setDecorations(R,S)),c={searchTerm:e,matches:h,currentIndex:0},console.debug("######## End of executing search")}function z(){T(!1),H();let e="Exited search mode";console.debug(e),f(e)}function H(){i="",c=null}function L(){console.debug("Deactivated")}0&&(module.exports={activate,deactivate});
