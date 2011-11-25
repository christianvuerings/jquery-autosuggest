/*
 * AutoSuggest
 * Copyright 2009-2010 Drew Wilson
 * www.drewwilson.com
 * code.drewwilson.com/entry/autosuggest-jquery-plugin
 *
 * Forked by Wu Yuntao
 * github.com/wuyuntao/jquery-autosuggest
 *
 * Version 1.6.2
 *
 * This Plug-In will auto-complete or auto-suggest completed search queries
 * for you as you type. You can add multiple selections and remove them on
 * the fly. It supports keybord navigation (UP + DOWN + RETURN), as well
 * as multiple AutoSuggest fields on the same page.
 *
 * Inspired by the Autocomplete plugin by: Joern Zaefferer
 * and the Facelist plugin by: Ian Tearle (iantearle.com)
 *
 * This AutoSuggest jQuery plug-in is dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 */

(function( $ ) {
    var methods = {

        init: function( data, options ) {
            var defaults = {
                asHtmlID: false,
                startText: "Enter Name Here",
                usePlaceholder: false,
                emptyText: "No Results Found",
                preFill: {},
                limitText: "No More Selections Are Allowed",
                selectedItemProp: "value", //name of object property
                selectedValuesProp: "value", //name of object property
                searchObjProps: "value", //comma separated list of object property names
                queryParam: "q",
                retrieveLimit: false, //number for 'limit' param on ajax request
                extraParams: "",
                matchCase: false,
                minChars: 1,
                keyDelay: 400,
                resultsHighlight: true,
                neverSubmit: false,
                selectionLimit: false,
                showResultList: true,
                showResultListWhenNoMatch: false,
                canGenerateNewSelections: true,
                scroll: false,
                scrollHeight: 200,
                start: function(){},
                selectionClick: function( elem ){},
                selectionAdded: function( elem ){},
                selectionRemoved: function( elem ) {
                    elem.remove();
                },
                formatList: false, //callback function
                beforeRetrieve: function( string ) {
                    return string;
                },
                retrieveComplete: function( data ) {
                    return data;
                },
                resultClick: function( data ){},
                resultsComplete: function(){}
            };
            var opts = $.extend( defaults, options );

            return this.each(function( x ) {
                var d_fetcher = false;
                var input = $( this );
                input.data( "opts", opts );
                input.data( "num_count", 0 );
                input.data( "selections", [] );
                var countValidItems = function( data ) {
                    var n = 0;
                    $.each( data, function() {
                        n++;
                    });
                    return n;
                };

                if ( $.isFunction( data ) ) {
                    d_fetcher = data;
                } else if ( typeof data === "string" ) {
                    d_fetcher = function( query, next ) {
                        var limit = "";
                        if ( opts.retrieveLimit ) {
                            limit = "&limit=" + encodeURIComponent( opts.retrieveLimit );
                        }
                        $.getJSON( data + "?" + opts.queryParam + "=" + encodeURIComponent( query ) + limit + opts.extraParams, function( data ) {
                            var new_data = opts.retrieveComplete.call( this, data );
                            next( new_data, query );
                        });
                    };
                } else if ( typeof data === "object" && countValidItems( data ) > 0 ) {
                    d_fetcher = function( query, next ) {
                        next( data, query );
                    };
                }

                if ( d_fetcher ) {
                    input.data( "results_ul", $( "<ul class='as-list'></ul>" ) );

                    var setup = function() {
                        if ( !opts.asHtmlID ) {
                            x = x + "" + Math.floor( Math.random() * 100 ); //this ensures there will be unique IDs on the page if autoSuggest() is called multiple times
                            input.data( "x_id", "as-input-" + x);
                        } else {
                            x = opts.asHtmlID;
                            input.data( "x_id", x);
                        }
                        opts.start.call( this, {
                            add: function( data ) {
                                input.autoSuggest( "add_selected_item", data, "u" + $( "li", input.data( "selections_holder" ) ).length ).addClass( "blur" );
                            },
                            remove: function( value ) {
                                input.data( "values_input" ).val( input.data( "values_input" ).val().replace( "," + value + ",", "," ) );
                                input.data( "selections_holder" ).find( "li[ data-value = '" + value + "' ]" ).remove();
                            }
                        });

                        input.attr( "autocomplete", "off" ).addClass( "as-input" ).attr( "id", input.data( "x_id" ) );
                        if ( opts.usePlaceholder ) {
                            input.attr( "placeholder", opts.startText );
                        } else {
                            input.val( opts.startText );
                        }


                        // Setup basic elements and render them to the DOM
                        input.wrap( "<ul class='as-selections' id='as-selections-" + x + "'></ul>" ).wrap( "<li class='as-original' id='as-original-" + x + "'></li>" );
                        input.data( "selections_holder", $( "#as-selections-" + x ) );
                        input.data( "org_li", $( "#as-original-" + x ) );
                        input.data( "results_holder", $( "<div class='as-results' id='as-results-" + x + "'></div>" ).hide() );
                        input.data( "values_input", $( "<input type='hidden' class='as-values' name='as_values_" + x + "' id='as-values-" + x + "' />" ) );

                        if ( typeof opts.preFill === "string" ) {
                            var vals = opts.preFill.split( "," );
                            for (var i = 0; i < vals.length; i++ ) {
                                var v_data = {};
                                v_data[ opts.selectedValuesProp ] = vals[ i ];
                                if ( vals[ i ] !== "" ) {
                                    input.autoSuggest( "add_selected_item", v_data, "000" + i );
                                }
                            }
                            input.data( "prefill_value", opts.preFill );
                        } else {
                            input.data( "prefill_value", "" );
                            var prefill_count = 0;
                            $.each( opts.preFill, function() {
                                prefill_count++;
                            });
                            if (prefill_count > 0) {
                                for ( var j = 0; j < prefill_count; j++ ) {
                                    var new_v = opts.preFill[ j ][ opts.selectedValuesProp ];
                                    if ( new_v === undefined ) {
                                        new_v = "";
                                    }
                                    input.data( "prefill_value", input.data( "prefill_value" ) + new_v + "," );
                                    if ( new_v !== "" ) {
                                        input.autoSuggest( "add_selected_item", opts.preFill[ j ], "000" + j );
                                    }
                                }
                            }
                        }
                        if ( input.data( "prefill_value") !== "" ) {
                            input.val( "" );
                            var lastChar = input.data( "prefill_value" ).substring( input.data( "prefill_value" ).length - 1 );
                            if ( lastChar !== "," ) {
                                input.data( "prefill_value", input.data( "prefill_value") + "," );
                            }
                            input.data( "values_input" ).val( "," + input.data( "prefill_value" ) );
                            $( "li.as-selection-item", input.data( "selections_holder" ) ).addClass( "blur" ).removeClass( "selected" );
                        }
                        input.after( input.data( "values_input" ) );
                        input.data( "selections_holder" ).click(function() {
                            input.data( "input_focus", true );
                            input.focus();
                        }).mousedown(function() {
                            input.data( "input_focus", false );
                        }).after(input.data( "results_holder" ));

                        // Handle input (functionfield events
                        input.focus(function(){
                            if ( !opts.usePlaceholder && $( this ).val() === opts.startText && input.data( "values_input" ).val() === "" ) {
                                $( this ).val( "" );
                            } else if ( input.data( "input_focus" ) ) {
                                $( "li.as-selection-item", input.data( "selections_holder" ) ).removeClass( "blur" );
                                if ( $( this ).val() !== "" ) {
                                    input.data( "results_ul" ).css( "width", input.data( "selections_holder" ).outerWidth() );
                                    input.data( "results_holder" ).show();
                                }
                            }
                            if ( input.data( "interval" ) ) {
                                clearInterval( input.data( "interval" ) );
                            }
                            input.data( "interval", setInterval(function() {
                                if ( opts.showResultList ) {
                                    if ( opts.selectionLimit && $( "li.as-selection-item", input.data( "selections_holder" ) ).length >= opts.selectionLimit ) {
                                        input.data( "results_ul" ).html( "<li class='as-message'>" + opts.limitText + "</li>" );
                                        input.data( "results_holder" ).show();
                                    } else {
                                        keyChange();
                                    }
                                }
                            }, opts.keyDelay));
                            input.data( "input_focus", true );
                            if (opts.minChars === 0 ) {
                              processRequest( $( this ).val() );
                            }
                            return true;
                        }).blur(function( e ) {
                            if ( !opts.usePlaceholder && $( this ).val() === "" && input.data( "values_input" ).val() === "" && input.data( "prefill_value" ) === "" && opts.minChars > 0 ) {
                                $( this ).val( opts.startText );
                            } else if ( input.data( "input_focus" ) ) {
                                $( "li.as-selection-item", input.data( "selections_holder" ) ).addClass( "blur" ).removeClass( "selected" );
                                input.data( "results_holder" ).hide();
                            }
                            if ( input.data("interval") ) {
                                clearInterval( input.data("interval") );
                            }
                        }).keydown(function( e ) {
                            first_focus = false;
                            var active = false;
                            switch( e.keyCode ) {
                                case 38: // up
                                    e.preventDefault();
                                    moveSelection( "up" );
                                    break;
                                case 40: // down
                                    e.preventDefault();
                                    moveSelection( "down" );
                                    break;
                                case 8:  // delete
                                    if ( input.val() === "" ) {
                                        var last = input.data( "values_input" ).val().split( "," );
                                        last = last[ last.length - 2 ];
                                        input.data( "selections_holder" ).children().not( input.data( "org_li" ).prev() ).removeClass( "selected" );
                                        if ( input.data( "org_li" ).prev().hasClass( "selected" ) ) {
                                            input.autoSuggest( "remove_item", last, input.data( "org_li" ).prev(), $( input.data( "org_li" ).prev() ).data( "data" ));
                                        } else {
                                            opts.selectionClick.call( this, input.data( "org_li" ).prev() );
                                            input.data( "org_li" ).prev().addClass( "selected" );
                                        }
                                    }
                                    if ( input.val().length === 1 ) {
                                        input.data( "results_holder" ).hide();
                                        input.data( "prev", "");
                                    }
                                    if ( $( ":visible", input.data( "results_holder" ) ).length > 0 ) {
                                        if ( input.data( "timeout" ) ) {
                                            clearTimeout( input.data( "timeout" ) );
                                        }
                                        input.data( "timeout", setTimeout(function() {
                                            keyChange();
                                        }, opts.keyDelay));
                                    }
                                    break;
                                case 9: case 188:  // tab or comm
                                    if ( opts.canGenerateNewSelections ) {
                                        input.data( "tab_press", true );
                                        var i_input = input.val().replace( /(,)/g, "" );
                                        active = $( "li.active:first", input.data( "results_holder" ) );
                                        // Generate a new bubble with text when no suggestion selected
                                        if ( i_input !== "" && input.data( "values_input" ).val().search( ","+i_input+"," ) < 0 && i_input.length >= opts.minChars && active.length === 0 ) {
                                            e.preventDefault();
                                            var n_data = {};
                                            n_data[ opts.selectedItemProp ] = i_input;
                                            n_data[ opts.selectedValuesProp ] = i_input;
                                            var lis = $( "li", input.data( "selections_holder" )).length;
                                            input.autoSuggest( "add_selected_item", n_data, "00" + ( lis + 1 ) );
                                            input.val( "" );
                                            break;
                                        }
                                    }
                                case 13: // return
                                    input.data( "tab_press", false );
                                    active = $( "li.active:first", input.data( "results_holder" ) );
                                    if ( active.length > 0 ) {
                                        active.click();
                                        input.data( "results_holder" ).hide();
                                    }
                                    if ( opts.neverSubmit || active.length > 0 ) {
                                        e.preventDefault();
                                    }
                                    break;
                                // ignore if the following keys are pressed: [escape] [shift] [capslock]
                                case 27: // escape
                                case 16: // shift
                                case 20: // capslock
                                    input.data( "results_holder" ).hide();
                                    break;
                            }
                        });
                    };

                    var keyChange = function() {
                        // Since most IME does not trigger any key events, if we press [del]
                        // and type some chinese character, `lastKeyPressCode` will still be [del].
                        // This might cause problem so we move the line to key events section;
                        // ignore if the following keys are pressed: [del] [shift] [capslock]
                        // if ( lastKeyPressCode === 46 || (lastKeyPressCode > 8 && lastKeyPressCode < 32) ){ return results_holder.hide(); }
                        var string = input.val().replace( /[\\]+|[\/]+/g,"" );
                        if (string === input.data( "prev" )) {
                            return;
                        }
                        input.data( "prev" , string );
                        if ( string.length >= opts.minChars && input.data( "selections_holder" ) ) {
                            input.data( "selections_holder" ).addClass( "loading" );
                            processRequest(string);
                        } else if ( input.data( "selections_holder" ) && input.data( "results_holder" ) ) {
                            input.data( "selections_holder" ).removeClass( "loading" );
                            input.data( "results_holder" ).hide();
                        }
                    };

                    var processRequest = function( string ) {
                      if ( opts.beforeRetrieve ) {
                          string = opts.beforeRetrieve.call( this, string );
                      }
                      d_fetcher( string, processData );
                    };

                    var processData = function( data, query ) {
                        if ( !opts.matchCase ) {
                            query = query.toLowerCase();
                        }
                        var matchCount = 0;
                        input.data( "results_holder" ).html( input.data( "results_ul" ).html( "" ) ).hide();
                        var d_count = countValidItems( data );
                        for ( var i = 0; i < d_count; i++ ) {
                            var num = i;
                            input.data( "num_count", input.data( "num_count" ) + 1 );
                            var forward = false;
                            var str = "";
                            if ( opts.searchObjProps === "value" ) {
                                str = data[ num ].value;
                            } else {
                                var names = opts.searchObjProps.split( "," );
                                for ( var y = 0; y < names.length; y++ ) {
                                    var name = $.trim( names[ y ] );
                                    str = str + data[ num ][ name ] + " ";
                                }
                            }
                            if ( str ) {
                                if ( !opts.matchCase ) {
                                    str = str.toLowerCase();
                                }
                                if ( str.search(query) != -1 && input.data( "values_input" ).val().search( "," + data[ num ][ opts.selectedValuesProp ] + "," ) === -1 ) {
                                    forward = true;
                                }
                            }
                            if ( forward ) {
                                var formatted = $( "<li class='as-result-item' id='as-result-item-" + num + "'></li>" ).click(function() {
                                        var raw_data = $( this ).data( "data" );
                                        var number = raw_data.num;
                                        if ( $( "#as-selection-" + number, input.data( "selections_holder" ) ).length <= 0 && !input.data( "tab_press" ) ) {
                                            var data = raw_data.attributes;
                                            input.val( "" ).focus();
                                            input.data( "prev", "");
                                            input.autoSuggest( "add_selected_item", data, number );
                                            opts.resultClick.call( this, raw_data );
                                            input.data( "results_holder" ).hide();
                                        }
                                        input.data( "tab_press", false );
                                    }).mousedown(function() {
                                        input.data( "input_focus", false );
                                    }).mouseover(function() {
                                        $( "li", input.data( "results_ul" )).removeClass( "active" );
                                        $( this ).addClass( "active" );
                                    }).data( "data", {
                                        attributes: data[ num ],
                                        num: input.data( "num_count" )
                                    });
                                var this_data = $.extend( {}, data[ num ] );
                                var regx = new RegExp( "(?![^&;]+;)(?!<[^<>]*)(" + query + ")(?![^<>]*>)(?![^&;]+;)", "g" );
                                if ( !opts.matchCase  ) {
                                    regx = new RegExp( "(?![^&;]+;)(?!<[^<>]*)(" + query + ")(?![^<>]*>)(?![^&;]+;)", "gi" );
                                }
                                if ( opts.resultsHighlight && query.length > 0 ) {
                                    this_data[ opts.selectedItemProp ] = this_data[ opts.selectedItemProp ].replace( regx,"<em>$1</em>" );
                                }
                                if ( !opts.formatList  ) {
                                    formatted = formatted.html( this_data[ opts.selectedItemProp ] );
                                } else {
                                    formatted = opts.formatList.call( this, this_data, formatted );
                                }
                                input.data( "results_ul" ).append( formatted );
                                delete this_data;
                                matchCount++;
                                if ( opts.retrieveLimit && opts.retrieveLimit === matchCount ) {
                                    break;
                                }
                            }
                        }
                        input.data( "selections_holder" ).removeClass( "loading" );
                        if ( matchCount <= 0 ) {
                            input.data( "results_ul" ).html( "<li class='as-message'>" + opts.emptyText + "</li>" );
                        }
                        input.data( "results_ul" ).css( "width", input.data( "selections_holder" ).outerWidth() );
                        if ( opts.scroll ) {
                            input.data( "results_ul" ).css({
                                "max-height": opts.scrollHeight,
                                "overflow-y": "scroll"
                            });
                        }
                        if ( matchCount > 0 ) {
                            input.data( "results_holder" ).show();
                        } else if ( !opts.showResultListWhenNoMatch ) {
                            input.data( "results_holder" ).hide();
                        }
                        opts.resultsComplete.call( this );
                    };

                    var moveSelection = function( direction ) {
                        if ( $( ":visible", input.data( "results_holder" ) ).length > 0 ) {
                            var lis = $( "li", input.data( "results_holder" ) );
                            var start = lis.filter( ":last" );
                            if ( direction === "down" ) {
                                start = lis.eq( 0 );
                            }
                            var active = $( "li.active:first", input.data( "results_holder" ) );
                            if ( active.length > 0 ) {
                                if ( direction === "down" ) {
                                    start = active.next();
                                } else {
                                    start = active.prev();
                                }
                            }
                            lis.removeClass( "active" );
                            start.addClass( "active" );
                            start.focus();
                            // Handle scrolling
                            if ( opts.scroll && start.length && ( start.position().top + start.height() > input.data( "results_ul" ).height() || start.position().top < 0 ) ) {
                                input.data( "results_ul" ).scrollTop( input.data( "results_ul" ).scrollTop() + ( start.position().top ) );
                            }
                        }
                    };

                    setup();
                }
            });

        },

        add_selected_item: function( data, num ) {
            return this.each(function( x ) {
                var input = $( this );
                if ( !num ) {
                    num = "00" + ($( "li", input.data( "selections_holder" )).length + 1);
                }
                input.data( "values_input" ).val( ( input.data( "values_input" ).val() || "," ) + data[ input.data( "opts" ).selectedValuesProp ] + "," );
                input.removeAttr( "placeholder" );
                var item = $( "<li class='as-selection-item' id='as-selection-" + num + "' data-value='" + data[ input.data( "opts" ).selectedValuesProp ] + "'></li>" ).click(function() {
                        input.data( "opts" ).selectionClick.call( this, $( this ) );
                        input.data( "selections_holder" ).children().removeClass( "selected" );
                        $( this ).addClass( "selected" );
                    }).mousedown(function() {
                        input.data( "input_focus", false );
                    }).data( "data", data );
                var close = $( "<a class='as-close'>&times;</a>" ).click(function() {
                        input.autoSuggest( "remove_item", data[ input.data( "opts" ).selectedValuesProp ], item, data );
                        input.data( "input_focus", true );
                        input.focus();
                        return false;
                    });
                input.data( "org_li" ).before( item.html( data[ input.data( "opts" ).selectedItemProp ] ).prepend( close ) );
                input.data( "selections" ).push( data );
                input.data( "opts" ).selectionAdded.call( this, input.data( "org_li" ).prev(), data[ input.data( "opts" ).selectedValuesProp ] );
                return input.data( "org_li" ).prev();
            });
        },

        remove_item: function( text, elt, data ) {
            return this.each(function( x ) {
                var input = $( this );
                input.data( "values_input" ).val( input.data( "values_input" ).val().replace( "," + text + ",", "," ) );
                input.data( "opts" ).selectionRemoved.call( this, $( elt ) );
                if ( input.data( "org_li" ).prev().length === 0 && input.data( "opts" ).usePlaceholder ) {
                    input.attr( "placeholder", input.data( "opts" ).startText);
                }
                var selections = input.data( "selections" );
                selections = $.grep( selections, function( sel, i ) {
                    return sel[ input.data( "opts" ).selectedValuesProp ] !== data[ input.data( "opts" ).selectedValuesProp ];
                });
                input.data( "selections", selections );
            });
        },

        get_selections: function() {
            return $( this ).data( "selections" ) || [];
        }
    };

    $.fn.autoSuggest = function( method ) {
        if (methods[method]) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else {
            return methods.init.apply( this, arguments );
        }
    };
})(jQuery);
