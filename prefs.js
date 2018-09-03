/*
 * Meneame Search Provider
 * An extension to search videos in Meneame with GNOME Shell
 *
 * Copyright (C) 2018
 * Lorenzo Carbonell <lorenzo.carbonell.cerezo@gmail.com>,
 * https://www.atareao.es
 *
 * This file is part of Meneame Search Provider
 * 
 * Meneame Search Provider is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Meneame Search Provider is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this extensions.
 * If not, see <http://www.gnu.org/licenses/>.
 */

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const Convenience = Extension.imports.convenience;
const PreferencesWidget = Extension.imports.preferenceswidget;
const Gettext = imports.gettext.domain(Extension.uuid);
const _ = Gettext.gettext;


function init() {
    Convenience.initTranslations();
}

class AboutWidget extends Gtk.Grid{
    constructor() {
        super({
            margin_bottom: 18,
            row_spacing: 8,
            hexpand: true,
            halign: Gtk.Align.CENTER,
            orientation: Gtk.Orientation.VERTICAL
        });

        let aboutIcon = new Gtk.Image({
            icon_name: "meneame",
            pixel_size: 128
        });
        this.add(aboutIcon);

        let aboutName = new Gtk.Label({
            label: "<b>" + _("Meneame Search Provider") + "</b>",
            use_markup: true
        });
        this.add(aboutName);

        let aboutVersion = new Gtk.Label({ label: _('Version: ') + Extension.metadata.version.toString() });
        this.add(aboutVersion);

        let aboutDescription = new Gtk.Label({
            label:  Extension.metadata.description
        });
        this.add(aboutDescription);

        let aboutWebsite = new Gtk.Label({
            label: '<a href="%s">%s</a>'.format(
                Extension.metadata.url,
                _("Atareao")
            ),
            use_markup: true
        });
        this.add(aboutWebsite);

        let aboutCopyright = new Gtk.Label({
            label: "<small>" + _('Copyright © 2018 Lorenzo Carbonell') + "</small>",
            use_markup: true
        });
        this.add(aboutCopyright);

        let aboutLicense = new Gtk.Label({
            label: "<small>" +
            _("This program is free software: you can redistribute it and/or modify") + "\n" +
            _("it under the terms of the GNU General Public License as published by") + "\n" +
            _("the Free Software Foundation, either version 3 of the License, or") + "\n" +
            _("(at your option) any later version.") + "\n\n" +
            _("This program is distributed in the hope that it will be useful,") + "\n" +
            _("but WITHOUT ANY WARRANTY; without even the implied warranty of") + "\n" +
            _("MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the") + "\n" +
            _("GNU General Public License for more details.") + "\n\n" +
            _("You should have received a copy of the GNU General Public License") + "\n" +
            _("along with this program.  If not, see <a href=\"https://www.gnu.org/licenses/\">https://www.gnu.org/licenses/</a>.") + "\n" +
            "</small>",
            use_markup: true,
            justify: Gtk.Justification.CENTER
        });
        this.add(aboutLicense);
    }
}

class WordReferenceSearchProviderPreferencesWidget extends PreferencesWidget.Stack{
    constructor(){
        super();

        Gtk.IconTheme.get_default().append_search_path(
            Extension.dir.get_child('icons').get_path());

        // Preferences Page
        let preferencesPage = this.addPage(
            "preferences",
            _("Preferences"),
            {}
        );

        var settings = Convenience.getSettings();
        
        let appearanceSection = preferencesPage.addSection(_("Search options"), null, {});
        appearanceSection.addGSetting(settings, "default");
        appearanceSection.addGSetting(settings, "where");
        appearanceSection.addGSetting(settings, "fields");
        appearanceSection.addGSetting(settings, "status");
        appearanceSection.addGSetting(settings, "periode");
        appearanceSection.addGSetting(settings, "order");

        // About Page
        let aboutPage = this.addPage(
            "about",
            _("About"),
            { vscrollbar_policy: Gtk.PolicyType.NEVER }
        );
        aboutPage.box.add(new AboutWidget());
        aboutPage.box.margin_top = 18;
    }
}

function buildPrefsWidget() {
    let wrsp = new WordReferenceSearchProviderPreferencesWidget();
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
        let prefsWindow = wrsp.get_toplevel()
        prefsWindow.get_titlebar().custom_title = wrsp.switcher;
        prefsWindow.connect("destroy", () => {
            wrsp.daemon.discovering = false;
        });
        return false;
    });

    wrsp.show_all();
    return wrsp;
}
