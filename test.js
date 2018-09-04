//imports.misc.extensionUtils.getCurrentExtension().imports.require;
imports.searchPath.unshift('.');
let data = '';
let position = -1;
do{
    position ++;
    position = data.indexOf('<div class="movie-card', position);
    let position_image_start = data.indexOf('src=', position) + 5;
    let position_image_end = data.indexOf('"', position_image_start);
    let image_url = data.substring(position_image_start, position_image_end);
    let position_url_start = data.indexOf('<div class="mc-title">', position_image_end) + 22;
    position_url_start = data.indexOf('href=', position_url_start) + 6;
    let position_url_end = data.indexOf('"', position_url_start);
    let url = data.substring(position_url_start, position_url_end);
    position_title_start = data.indexOf('title=', position_url_end) + 7;
    let position_title_end = data.indexOf('"', position_title_start);
    let title = data.substring(position_title_start, position_title_end);
    let position_puntuation_start = data.indexOf('<div class="avgrat-box">', position_title_end) + 24;
    let position_puntuation_end = data.indexOf('<', position_puntuation_start);
    let puntuation  = data.substring(position_puntuation_start, position_puntuation_end);
    let estrellas = Math.round(parseFloat(puntuation.replace(',','.')));
    let position_people_start = data.indexOf('<div class="ratcount-box">', position_puntuation_end) + 26;
    let position_people_end = data.indexOf('<', position_people_start);
    let people  = data.substring(position_people_start, position_people_end).trim();
    let content = '☆'.repeat(10-estrellas) + '★'.repeat(estrellas) + ' ('+puntuation+') 👤 '+ people;
    let element = { 
                url: url,
                image_url: image_url,
                title: title,
                content: content
    }
    print(JSON.stringify(element));

}while(position > -1)
