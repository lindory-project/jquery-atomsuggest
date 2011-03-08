//
// jquery.atomsuggest.js, licensed under the MIT license.
//
// (c) 2010 INIST-CNRS, Nicolas Thouvenin <nicolas.thouvenin@inist.fr>
//
// For the full copyright and license information, please view the LICENSE
// file that was distributed with this source code.
//
(function($) {
		$.fn.selectRange = function(start, end) {
			return this.each(function() {
					if(this.setSelectionRange) {
						this.focus();
						this.setSelectionRange(start, end);
					} else if(this.createTextRange) {
						var range = this.createTextRange();
						range.collapse(true);
						range.moveEnd('character', end);
						range.moveStart('character', start);
						range.select();
					}
			});
		};

		$.fn.atomsuggest = function(options) {


			function chooser(c,n)
			{
				if (!c.hasClass('hentry')) {
					$(" > div.hentry:first", _AS_context).addClass('selected');
				}
				else if (n.hasClass('hentry')) {
					c.removeClass('selected');
					n.addClass('selected');
					$(_AS_inputField).val(n.text());
					$(_AS_inputField).selectRange(_AS_currentValue.length, n.text().length);
				}
			}

			function highlight(saisie)
			{
				$("div.hentry p.headline, div.hentry p.content, div.selected p.headline, div.selected p.content", _AS_context).each( function() {
						var chaine="";
						if($(this).text().search(saisie) != -1) {
							chaine+=$(this).text().substr(0,$(this).text().search(saisie));
							chaine+="<span class='highlight'>"+$(this).text().substr($(this).text().search(saisie),saisie.length);
							var nbDebutFinValeur = $(this).text().search(saisie)+(saisie.length);
							var nbFinValeurFin = $(this).text().length-($(this).text().search(saisie)+(saisie.length));
							chaine+="</span>"+$(this).text().substr(nbDebutFinValeur, nbFinValeurFin)
							$(this).empty();
							$(this).append(chaine);
						}
				});
			}

			function uget(v) 
			{
				return typeof(v) == "function" ? v() : v;
			}

			function valof(entry) 
			{
				if (typeof entry.$t != 'undefined')
					return entry.$t;
				else if (typeof entry.value != 'undefined')
					return entry.value;
				else
					return '';
			}

			function content2p(content)	
			{
				if (content.type=="html" || content.type == "text/html")
					return $("<p>").addClass("content").html(valof(content));
				else
					return $("<p>").addClass("content").text(valof(content));
			}

			function entry2div(entry)
			{
				var div = $("<div>").addClass("hentry").width(function() {return $(_AS_context).innerWidth();})


				$("<p>").addClass("headline").append(valof(entry.title)).appendTo(div);
				if (_AS_options.showInfos.identifier && entry.id)
					$("<p>").addClass("identifier").append(valof(entry.id)).appendTo(div);

				if (_AS_options.showInfos.updated && entry.updated)
					$("<p>").addClass("updated").append(valof(entry.updated)).appendTo(div);

				if (_AS_options.showInfos.content && entry.content) {
					if (entry.content[0])
						$.each(entry.content, function(i, item) { content2p(item).appendTo(div); });
					else
						content2p(entry.content).appendTo(div);
				}
				div.mousedown(function () {
						$(_AS_inputField).attr("value", $(this).find("p.headline").text());
						if (typeof(_AS_options.onSelect) == "function") 
							_AS_options.onSelect(entry);
						$(_AS_context).hide();
						while($(" > *", _AS_context).length>0) 
							$(_AS_context).empty();
						$(_AS_inputField).focus();
				});
				div.mouseover(function() {
						$(" > div.selected", _AS_context).removeClass('selected');
						$(this).addClass('selected');
				});
				div.mouseout(function() {
						$(this).removeClass('selected');
				});
				return div;
			}


			var _AS_options      = $.extend( {
					"url": "",
					"widthFactor": 1,
					"showInfos": {"identifier": false, "updated": false, "content": false, "result": false},
					"paramValue": "",
					"extramParam": {"ws": "", "alt": "", "action": "", "lang": "fr"},
					"triggerLength" : 3,
					"onSelect" : null,
					"onRequest" : null
				}, options);
			var _AS_inputField   = $(this).attr("autocomplete", "off");
			var _AS_lastCall;
			var _AS_lastResponse;
			var _AS_currentValue = "";
			var _AS_context      = $("<div>")
			.hide()
			.addClass('feed atomsuggest')
			.css({
					zIndex: "1",
					top: $(_AS_inputField).offsetTop + $(_AS_inputField).height() + 7 + "px",
					left: $(_AS_inputField).offsetLeft + "px" 
			})
			.width(function(){
				if (_AS_options.widthFactor)
					return $(_AS_inputField).outerWidth()*_AS_options.widthFactor+"px";
				else
					return $(_AS_inputField).outerWidth()+"px";
			})
			.appendTo(_AS_inputField.parent());


			if($.browser.opera) {
				$(_AS_context).css("width", parseInt($(_AS_inputField).css("width"))*parseInt(_AS_options.widthFactor)+"px");
				$(_AS_context).css("top", parseInt($(_AS_inputField).offset().top)+parseInt($(_AS_inputField).css("height"))+7+"px");
			}

			$.ajaxSetup({
					"error":function(XMLHttpRequest,textStatus, errorThrown) {
						$(_AS_context).hide();
						//                                    alert(textStatus);
						//                                    alert(errorThrown);
						//                                    alert(XMLHttpRequest.responseText);
					}
			});


			$(_AS_inputField).keypress( function(event) {
					if(event.keyCode == 13 ) {
						var l = $(" > *", _AS_context).length;

						if (typeof(_AS_options.onSelect) == "function")
							_AS_options.onSelect(_AS_lastResponse.feed.entry[$(" > div.selected", _AS_context).index()]);

						while($(" > *", _AS_context).length>0) $(_AS_context).empty();
						$(_AS_context).hide();

						return l == 0 ? true : false;
					}
			});
			$(_AS_inputField).keyup( function(event) {

					if (event.keyCode == 40 ) { // En bas
						var c = $(" > div.selected", _AS_context);
						var n = $(" > div.selected + div.hentry:first", _AS_context);
						chooser(c,n);
						return true;
					}
					else if (event.keyCode == 38 ) { // En haut
						var c = $(" > div.selected", _AS_context);
						var n = c.prev();
						chooser(c,n);
						return true;
					}
					else if (event.keyCode == 27 ) { // Échappe
						while($(" > *", _AS_context).length>0) $(_AS_context).empty();
						$(_AS_context).hide();
						return true;
					}
					else if (event.keyCode == 13 ) {
						return true;
					}

					if(_AS_currentValue != $(_AS_inputField).val() && $(_AS_inputField).val().length >= _AS_options.triggerLength) {
						_AS_currentValue = $(_AS_inputField).val();
						var parameters   = new Object();
						for (cle in _AS_options.extraParams) {
							parameters[cle] = uget(_AS_options.extraParams[cle]);
						}
						parameters[_AS_options.paramValue] = typeof _AS_options.onRequest == 'function' ? _AS_options.onRequest(_AS_currentValue) : _AS_currentValue;

						if(typeof _AS_lastCall != 'undefined') {
							_AS_lastCall.abort();
						}

						_AS_lastCall = $.getJSON( uget(_AS_options.url), parameters, function (jsonResponse) {
								_AS_lastResponse = jsonResponse;
								while($(" > *", _AS_context).length>0) $(_AS_context).empty();
								$(_AS_context).show();

								if (jsonResponse.feed.entry) {
									if (jsonResponse.feed.entry[0]) {
										$.each(jsonResponse.feed.entry, function(i, entry) {
												entry2div(entry).appendTo($(_AS_context));
										});
									}
									else {
										entry2div(jsonResponse.feed.entry).appendTo($(_AS_context));
									}
								}
								$(" > div.hentry:first", _AS_context).addClass('selected');

								if(_AS_options.showInfos.result) {
									var result = "";
									if(jsonResponse.feed.openSearch$totalResults) {
										if(parseInt(valof(jsonResponse.feed.openSearch$totalResults))>=parseInt(valof(jsonResponse.feed.openSearch$itemsPerPage)))
											result = valof(jsonResponse.feed.openSearch$itemsPerPage);
										else
											result = valof(jsonResponse.feed.openSearch$totalResults)-1;

										$("<div>").addClass("result")
										.append("Résultats : <span>"+(parseInt(result))+ "</span> sur <span>"+(parseInt(valof(jsonResponse.feed.openSearch$totalResults))-1)+"</span>")
										.appendTo($(_AS_context));
									}
									else {
										$("<div>").addClass("result")
										.append("<span>"+suggestDivRows+"</span> résultat(s) affiché(s)")
										.appendTo($(_AS_context));
									}
								}

								//highlight pour les mots ne commencant pas par une minuscule
								highlight(_AS_currentValue.substring(0,1).toLowerCase()+_AS_currentValue.substring(1));

								//highlight pour les mots commencant par une majuscule
								highlight(_AS_currentValue.substring(0,1).toUpperCase()+_AS_currentValue.substring(1));
						});
						$(_AS_inputField).focus()	;
					}
			});

			// recalcule la taille des suggestions
			$(window).resize( function() {
					$(_AS_context)
					.width($(_AS_inputField).width()*_AS_options.widthFactor+"px")
					.offset({
							top : $(_AS_inputField).offset().top +$(_AS_inputField).height()+7,
							left: $(_AS_inputField).offset().left
					});
			});
		}
})(jQuery);
