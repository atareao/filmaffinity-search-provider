/*
 * Filmaffinity Search Provider
 * An extension to search videos in Filmaffinity with GNOME Shell
 *
 * Copyright (C) 2018
 * Lorenzo Carbonell <lorenzo.carbonell.cerezo@gmail.com>,
 * https://www.atareao.es
 *
 * This file is part of Filmaffinity Search Provider
 * 
 * Filmaffinity Search Provider is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Filmaffinity Search Provider is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this extensions.
 * If not, see <http://www.gnu.org/licenses/>.
 */

const GLib = imports.gi.GLib;
const Soup = imports.gi.Soup;
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;

const PROTOCOL = 'https';
const BASE_URL = 'www.filmaffinity.com';
const BASE_URL_IMAGES = 'pics.filmaffinity.com';
const SEARCH = '/search.php?stext=%s';
const USER_AGENT = 'GNOME Shell - FilmaffinitySearchProvider - extension';
const HTTP_TIMEOUT = 10;


const ORDER = { // param "o"
    0: "relevance",
    1: "year"
}
function _build_result_url(relative){
    let url = '%s://%s/%s'.format(
        PROTOCOL,
        BASE_URL_IMAGES,
        relative
    );
    return url;
}

function _build_film_result_url(relative){
    let url = '%s://%s%s'.format(
        PROTOCOL,
        BASE_URL,
        relative
    );
    return url;
}

class FilmaffinityClient{
    constructor(params){
        this._protocol = PROTOCOL;
        this._base_url = BASE_URL;
        let [res, out, err, status] = GLib.spawn_command_line_sync('locale');
        let regexp = /LANG=([a-z][a-z])_.*/gim;
        let result = regexp.exec(out);
        let countries = ['es', 'en', 'mx', 'ar', 'cl', 'co', 'uy', 'pe', 'ec', 've'];
        let country = result[1];
        if(!countries.includes(country)){
            country = 'en';
        }
        this._country = country;
        this._settings = Convenience.getSettings();
        this._order = ORDER[this._settings.get_enum('order')]
        this._settings.connect("changed", ()=>{
            this._order = ORDER[this._settings.get_enum('order')]
            });
    }

    _build_query_url(word){
        word = word.substring(2).trim();
        let url = '%s://%s/%s/search.php?stype=title&stext=%s&orderby=%s'.format(
            this._protocol,
            this._base_url,
            this._country,
            encodeURIComponent(word),
            this._order
        );
        return url;
    }

    get(word, callback, p1, p2) {
        let query_url = this._build_query_url(word);
        log('FFFF: query_url' + query_url);
        if(query_url != null){
            let request = Soup.Message.new('GET', query_url);
            _get_soup_session().queue_message(request,
                (http_session, message) => {
                    if(message.status_code !== Soup.KnownStatusCode.OK) {
                        let error_message =
                            "Filmaffinity.Client:get(): Error code: %s".format(
                                message.status_code
                            );
                            callback(error_message, null);
                        return;
                    }else{
                        try {
                            let data = request.response_body.data;
                            let position = -1;
                            let results = [];
                            let i = 0;
                            log('FFFF: 11');
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
                                let position_title_start = data.indexOf('title=', position_url_end) + 7;
                                let position_title_end = data.indexOf('"', position_title_start);
                                let title = data.substring(position_title_start, position_title_end);
                                let position_puntuation_start = data.indexOf('<div class="avgrat-box">', position_title_end) + 24;
                                let position_puntuation_end = data.indexOf('<', position_puntuation_start);
                                let puntuation  = data.substring(position_puntuation_start, position_puntuation_end);
                                let estrellas = Math.round(parseFloat(puntuation.replace(',','.')));
                                let position_people_start = data.indexOf('<div class="ratcount-box">', position_puntuation_end) + 26;
                                let position_people_end = data.indexOf('<', position_people_start);
                                let people  = data.substring(position_people_start, position_people_end).trim();
                                let content =  '☆☆☆☆☆☆☆☆☆☆ (--) 👤 --';
                                if(puntuation != '--'){
                                    content = '☆'.repeat(10 - estrellas) + '★'.repeat(estrellas) + ' (' + puntuation + ') 👤 '+ people;
                                }
                                if(position > -1 && results.length < 6)
                                {
                                    if(!image_url.endsWith('.js'))
                                    {
                                        log('FFFF image_url: ' + image_url);
                                        log('FFFF url: ' + _build_film_result_url(url));
                                        log('FFFF title: ' + title);
                                        log('FFFF content: ' + content);
                                        results.push({
                                            id: 'index_'+i,
                                            label: title,
                                            url: _build_film_result_url(url),
                                            description: content,
                                            thumbnail_url: image_url,
                                            thumbnail_width: 100,
                                            thumbnail_height: 150
                                        });
                                        i += 1;
                                    }
                                }
                            }while(position > -1)
                            if(results.length > 0){
                                callback(null, results, p1, p2);
                                return;
                            }
                        }
                        catch(e) {
                            let message = "Filmaffinity.Client:get(): %s".format(e);
                            callback(message, null, p1, p2);
                            return;
                        }
                    }
                }
            );
        }
        let message = "Nothing found";
        callback(message, null, p1, p2);
    }
    destroy() {
        _get_soup_session().run_dispose();
        _SESSION = null;
    }

    get protocol() {
        return this._protocol;
    }

    set protocol(protocol) {
        this._protocol = protocol;
    }

    get base_url() {
        return this._base_url;
    }

    set base_url(url) {
        this._base_url = url;
    }
}

var _SESSION = null;

function _get_soup_session() {
    if(_SESSION === null) {
        _SESSION = new Soup.SessionAsync();
        Soup.Session.prototype.add_feature.call(
            _SESSION,
            new Soup.ProxyResolverDefault()
        );
        _SESSION.user_agent = USER_AGENT;
        _SESSION.timeout = HTTP_TIMEOUT;
    }

    return _SESSION;
}
