// Problemenebazpena.eus lantaldearen txantiloien egokitzapen digitala, 2026-11-05.
const TEMPLATES = [
 {id:'ulermena',title:'Ulermena',question:'Zer ulertu behar dut?',groups:[
  ['Istorioa / Egoera ulertzen dut',[['story','Nire hitzekin azaldu istorioa'],['people','Nor edo zer agertzen da? Zein elementu dira garrantzitsuak?']]],
  ['Enuntziatuan agertzen den informazioa',[['known','BADAGOEN informazioa'],['missing','EZ DAGOEN informazioa, baina behar litekeena']]],
  ['Datuak',[['numbers','Istorioan zenbakiak agertzen dira?','select','Hautatu|Bai|Ez'],['meaning','Zer adierazten dute datuek? Zenbakirik ez badago, zer informazio daukagu?']]],
  ['Irudikapena',[['representation','Nire irudikapena: planoa, taula edo eskema azaldu. Paperean egin badut, identifikatu hemen.']]],
  ['Problemaren galdera',[['questionExists','Galdera argirik badago?','select','Hautatu|Bai|Ez'],['question','Zein da galdera? Ez badago, zein galdera egin liteke?']]],
  ['Erantzun daiteke?',[['possible','Badugun informazioarekin erantzun dakioke?','select','Hautatu|Bai|Ez|Ez dakit'],['why','Zergatik? Zein datu edo baldintza behar duzu?']]],
  ['Egiaztatu ulermena',[['understood','Istorioa ondo ulertu dut','check'],['separate','Informazio garrantzitsua bereizten dakit','check'],['haveQuestion','Galdera zein den badakit edo proposatu dezaket','check'],['explain','Problema beste norbaiti azaldu diezaioket','check']]]]},
 {id:'arrazonamendua',title:'Arrazoiketa',question:'Zein bide probatuko dut?',groups:[
  ['Zer dakit eta zer ez dakit',[['known','Badakit: datuak eta ideiak'],['unknown','Ez dakit oraindik: aurkitu behar dudana']]],
  ['Ideiak eta hipotesiak',[['hypothesis','Zer gerta liteke? Zer uste dut?'],['why','Zergatik uste dut hori?']]],
  ['Estrategia posibleak',[['drawing','Marrazkia / irudikapena','check'],['table','Taula edo eskema','check'],['trial','Saiakuntza eta errorea','check'],['decompose','Banaketa / deskonposizioa','check'],['reverse','Alderantzizko pentsamendua','check'],['other','Beste estrategia bat']]],
  ['Aukeratutako estrategia',[['strategy','Zein estrategia aukeratu dut?'],['choice','Zergatik aukeratu dut?']]],
  ['Probak eta pentsamenduaren jarraipena',[['first','Zer egin dut lehenik?'],['next','Ondoren zer egin dut?'],['change','Zer aldatu dut, behar izan dudanean?']]],
  ['Arrazoibidea azaltzen dut',[['reason','Nire pentsamendua pausoz pauso azaltzen dut']]]]},
 {id:'autonomia',title:'Autonomia',question:'Nola defendatuko dut nire erabakia?',groups:[
  ['Problema ulertu dut?',[['story','Nire hitzekin azaldu problema'],['goal','Zer aurkitu behar dut zehazki?']]],
  ['Nire plana',[['strategy','Zein estrategia erabiliko dut? Zergatik?'],['steps','Zein urrats jarraituko ditut?']]],
  ['Ebazpena',[['solution','Eragiketak eta prozesua']]],
  ['Emaitza',[['result','Erantzuna esaldi osoz eta unitateekin']]],
  ['Egiaztapena',[['matches','Lortu dudana eta eskatzen didatena bat datoz?','select','Hautatu|Bai|Ez|Oraindik egiaztatzeko'],['proof','Zein frogarekin egiaztatu dut?']]],
  ['Autoerregulazioa',[['learned','Zer ikasi dut problema honetatik?'],['strategyGood','Nire estrategia egokia izan da','check'],['another','Beste bide bat egon liteke','check'],['corrected','Akats bat aurkitu eta zuzendu dut','check'],['reasonable','Nire emaitza zentzuzkoa da','check'],['before','Hasi aurretik problema ulertu dudala egiaztatu dut','check'],['alternatives','Estrategia aukeratu aurretik beste aukera batzuk pentsatu ditut','check'],['changed','Estrategia aldatzea beharrezkoa izan da','check'],['errorWhy','Akats bat aurkitu eta zergatik gertatu den ulertu dut','check'],['verified','Egiaztapenak erantzuna zuzentzen lagundu dit','check'],['regulation','Zer erabaki edo egiaztapenek lagundu dit? Zer egingo dut hurrengoan?']]]]},
 {id:'egoerak',title:'Egoera problematizatuak',question:'Nola erabili beste egoera batean?',groups:[
  ['Datuak eta galdera',[['useful','Datu ezagunak: zein dira baliagarriak?'],['unneeded','Zein datu ez dira behar?'],['unknown','Zein informazio EZ dit ematen enuntziatuak?'],['question','Zein da problemaren galdera?'],['allData','Datu numerikoak eta ez-numerikoak aztertu ditut','check'],['understand','Galdera ondo ulertu dut','check']]],
  ['Irudikapena',[['kind','Nola irudikatuko dut?','select','Hautatu|Taula|Diagrama edo eskema|Marrazkia edo irudi geometrikoa|Bestelakoa'],['representation','Nire irudikapena edo haren azalpena']]],
  ['Ebazpena',[['options','Zein estrategia edo aukera dira posible?'],['strategy','Zein aukeratu dut eta zergatik?'],['model','Adierazpen matematikoa eta ebazpena']]],
  ['Emaitza',[['result','Erantzun koherente arrazoitua'],['sentence','Erantzuna esaldi osoz eman dut','check'],['reasoned','Erantzuna arrazoitu dut','check'],['units','Unitate eta zehaztasun-maila egokiak erabili ditut','check'],['checked','Emaitza egiaztatu dut eta koherentea da','check']]],
  ['Nire aldaera eta hurrengo urratsa',[['variant','Sortu zuk baldintza edo galdera berri bat. Ebatzi eta konparatu.'],['self','Zer erakutsi dut? Non dago froga? Zer berrikusiko dut?']]]]}
];
const PROGRESSION=[['LH5','Irudikatu eta alderatu','Bi diseinu azaldu, froga konkretuekin.'],['LH6','Lotu eta egiaztatu','Eskala, planoa eta kokapenaren baldintzak uztartu.'],['DBH1','Erlazioak modelizatu','Bi ebazpide kontrastatu eta baliabideen muga arrazoitu.'],['DBH2','Orokortu eta erabaki','Ereduak alderatu, mugak aztertu eta aldaera bat sortu.']];
const ROUTES=['Eskolako ortua','Azokako txanponak','Jolas-eremuko mosaikoa','Ibilaldiaren mapa','Errezeta handitu','Kirol-eguneko datuak','Azokako postuak','Bizikleta-ibilbidea','Ur-kontsumoa','Energia-aukerak','Kostaldeko datuak','Ibilbide eraginkorra'];
