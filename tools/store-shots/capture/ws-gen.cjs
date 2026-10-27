const W='' + require('path').join(__dirname, '..') + '';
const g=(id,size,found,extra='')=>'/shots?size='+size+'&game='+id+'&found='+found+extra+'&go=/play/'+id;
const shots=[
 {name:'home',url:'/shots'},
 {name:'home-scroll',url:'/shots',steps:[{scroll:330}]},
 {name:'daily',url:'/shots?go=/(tabs)/daily'},
 {name:'daily-scroll',url:'/shots?go=/(tabs)/daily',steps:[{scroll:250}]},
 {name:'settings2',url:'/shots?go=/(tabs)/settings',steps:[{scroll:700}]},
 {name:'play-L',url:g('animals:easy:10','large',3)},
 {name:'play-C',url:g('animals:easy:10','comfortable',2)},
 {name:'play-XL',url:g('animals:easy:10','xlarge',2)},
 {name:'play-H',url:g('animals:easy:10','huge',2)},
 {name:'play-food',url:g('food:easy:7','xlarge',2)},
 {name:'play-dark',url:g('nature:medium:3','large',3,'&theme=dark'),dark:true},
 {name:'play-hc',url:g('birds:easy:5','xlarge',2,'&theme=high-contrast')},
 {name:'play-hard',url:g('travel:hard:2','comfortable',4,'&diff=hard')},
 {name:'play-med',url:g('holidays:medium:4','comfortable',3,'&diff=medium')},
 {name:'pack-food',url:'/shots?go=/packs/food'},
];
require('fs').writeFileSync(W+'/capture/ws.json',JSON.stringify({base:'http://localhost:8092',out:W+'/raw/ws',fakeTime:'2026-10-29T10:12:00',css:'a[role=tab] div{overflow:visible !important}',shots}));
