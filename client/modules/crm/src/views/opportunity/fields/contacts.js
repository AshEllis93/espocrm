/************************************************************************
 * This file is part of EspoCRM.
 *
 * EspoCRM - Open Source CRM application.
 * Copyright (C) 2014-2022 Yurii Kuznietsov, Taras Machyshyn, Oleksii Avramenko
 * Website: https://www.espocrm.com
 *
 * EspoCRM is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * EspoCRM is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EspoCRM. If not, see http://www.gnu.org/licenses/.
 *
 * The interactive user interfaces in modified source and object code versions
 * of this program must display Appropriate Legal Notices, as required under
 * Section 5 of the GNU General Public License version 3.
 *
 * In accordance with Section 7(b) of the GNU General Public License version 3,
 * these Appropriate Legal Notices must retain the display of the "EspoCRM" word.
 ************************************************************************/

define(
    'crm:views/opportunity/fields/contacts',
    ['views/fields/link-multiple-with-role', 'views/fields/link-multiple-with-primary'],
    function (Dep, LinkMultipleWithPrimary) {

    return Dep.extend({

        events: {
            'click [data-action="switchPrimary"]': function (e) {
                let $target = $(e.currentTarget);
                let id = $target.data('id');

                LinkMultipleWithPrimary.prototype.switchPrimary.call(this, id);
            }
        },

         getAttributeList: function () {
            let list = Dep.prototype.getAttributeList.call(this);

            list.push(this.primaryIdFieldName);
            list.push(this.primaryNameFieldName);

            return list;
        },

        setup: function () {
            this.primaryLink = 'contact';

            this.primaryIdFieldName = this.primaryLink + 'Id';
            this.primaryNameFieldName = this.primaryLink + 'Name';

            Dep.prototype.setup.call(this);

            this.primaryId = this.model.get(this.primaryIdFieldName);
            this.primaryName = this.model.get(this.primaryNameFieldName);

            this.listenTo(this.model, 'change:' + this.primaryIdFieldName, () => {
                this.primaryId = this.model.get(this.primaryIdFieldName);
                this.primaryName = this.model.get(this.primaryNameFieldName);
            });
        },

        setPrimaryId: function (id) {
            this.primaryId = id;

            if (id) {
                this.primaryName = this.nameHash[id];
            } else {
                this.primaryName = null;
            }

            this.trigger('change');
        },

        renderLinks: function () {
            if (this.primaryId) {
                this.addLinkHtml(this.primaryId, this.primaryName);
            }

            this.ids.forEach(id => {
                if (id !== this.primaryId) {
                    this.addLinkHtml(id, this.nameHash[id]);
                }
            });
        },

        getValueForDisplay: function () {
            if (this.isDetailMode() || this.isListMode()) {
                let itemList = [];

                if (this.primaryId) {
                    itemList.push(
                        this.getDetailLinkHtml(this.primaryId, this.primaryName)
                    );
                }

                if (!this.ids.length) {
                    return;
                }

                this.ids.forEach(id =>{
                    if (id !== this.primaryId) {
                        itemList.push(
                            this.getDetailLinkHtml(id)
                        );
                    }
                });

                return itemList
                    .map(item => $('<div>').append(item).get(0).outerHTML)
                    .join('');
            }
        },

        deleteLink: function (id) {
            if (id === this.primaryId) {
                this.setPrimaryId(null);
            }

            Dep.prototype.deleteLink.call(this, id);
        },

        deleteLinkHtml: function (id) {
            Dep.prototype.deleteLinkHtml.call(this, id);

            this.managePrimaryButton();
        },

        addLinkHtml: function (id, name) {
            name = name || id;

            if (this.isSearchMode()) {
                return Dep.prototype.addLinkHtml.call(this, id, name);
            }

            if (this.skipRoles) {
                return LinkMultipleWithPrimary.prototype.addLinkHtml.call(this, id, name);
            }

            let $el = Dep.prototype.addLinkHtml.call(this, id, name);

            let isPrimary = (id === this.primaryId);

            let $star = $('<span>')
                .addClass('fas fa-star fa-sm')
                .addClass(!isPrimary ? 'text-muted' : '')

            let $button = $('<button>')
                .attr('type', 'button')
                .addClass('btn btn-link btn-sm pull-right hidden')
                .attr('title', this.translate('Primary'))
                .attr('data-action', 'switchPrimary')
                .attr('data-id', id)
                .append($star);

            $button.insertAfter($el.children().first().children().first());

            this.managePrimaryButton();

            return $el;
        },

        managePrimaryButton: function () {
            let $primary = this.$el.find('button[data-action="switchPrimary"]');

            if ($primary.length > 1) {
                $primary.removeClass('hidden');
            } else {
                $primary.addClass('hidden');
            }

            if ($primary.filter('.active').length === 0) {
                let $first = $primary.first();

                if ($first.length) {
                    $first.addClass('active').children().removeClass('text-muted');
                    this.setPrimaryId($first.data('id'));
                }
            }
        },

        fetch: function () {
            let data = Dep.prototype.fetch.call(this);

            data[this.primaryIdFieldName] = this.primaryId;
            data[this.primaryNameFieldName] = this.primaryName;

            return data;
        },

        getSelectFilters: function () {
            if (this.model.get('accountId')) {
                let nameHash = {};

                nameHash[this.model.get('accountId')] = this.model.get('accountName');

                return {
                    'accounts': {
                        type: 'linkedWith',
                        value: [this.model.get('accountId')],
                        data: {
                            type: 'anyOf',
                            nameHash: nameHash,
                        },
                    }
                };
            }
        },

        getCreateAttributes: function () {
            if (this.model.get('accountId')) {
                return {
                    accountId: this.model.get('accountId'),
                    accountName: this.model.get('accountName')
                }
            }
        },
    });
});
