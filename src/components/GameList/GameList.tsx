/*
 * Copyright (C) 2012-2017  Online-Go.com
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from "react";
import {OGSComponent} from "components";
import {_, interpolate} from "translate";
import preferences from "preferences";
import {Goban} from "goban";
import {termination_socket} from "sockets";
import {makePlayerLink} from "Player";
import {MiniGoban} from "MiniGoban";
import {GobanLineSummary} from "GobanLineSummary";
import data from "data";

interface GameListProps {
    list: Array<any>;
    emptyMessage?: string;
    opponentStyle: boolean;
    disableSort?: boolean;
}

export class GameList extends React.PureComponent<GameListProps, any> {
    constructor(props) {
        super(props);
        this.state = {
            sort_order: 'clock'
        };
    }

    sortByClock = () => {
        if (this.state.sort_order === 'clock') {
            this.setState({sort_order: '-clock'});
        } else {
            this.setState({sort_order: 'clock'});
        }
    }

    sortByOpponentClock = () => {
        if (this.state.sort_order === 'opponent-clock') {
            this.setState({sort_order: '-opponent-clock'});
        } else {
            this.setState({sort_order: 'opponent-clock'});
        }
    }

    sortByOpponent = () => {
        if (this.state.sort_order === 'opponent') {
            this.setState({sort_order: '-opponent'});
        } else {
            this.setState({sort_order: 'opponent'});
        }
    }

    sortByName = () => {
        if (this.state.sort_order === 'name') {
            this.setState({sort_order: '-name'});
        } else {
            this.setState({sort_order: 'name'});
        }
    }

    sortByMoveNumber = () => {
        if (this.state.sort_order === 'move-number') {
            this.setState({sort_order: '-move-number'});
        } else {
            this.setState({sort_order: 'move-number'});
        }
    }

    render() {
        let user = data.get('user');
        let lst = this.props.list.slice(0);

        if (!this.props.disableSort) {
            switch (this.state.sort_order) {
                case '-clock':
                case 'clock':
                    lst.sort((a, b) => {
                        try {
                            if (a.json.clock.current_player === user.id && b.json.clock.current_player !== user.id) {
                                return -1;
                            }
                            if (b.json.clock.current_player === user.id && a.json.clock.current_player !== user.id) {
                                return 1;
                            }

                            return a.json.clock.expiration - b.json.clock.expiration || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-opponent-clock':
                case 'opponent-clock':
                    lst.sort((a, b) => {
                        try {
                            if (a.json.clock.current_player === user.id && b.json.clock.current_player !== user.id) {
                                return 1;
                            }
                            if (b.json.clock.current_player === user.id && a.json.clock.current_player !== user.id) {
                                return -1;
                            }

                            return a.json.clock.expiration - b.json.clock.expiration || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-name':
                case 'name':
                    lst.sort((a, b) => {
                        try {
                            return a.name.localeCompare(b.name) || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-opponent':
                case 'opponent':
                    lst.sort((a, b) => {
                        try {
                            let a_opponent = a.black.id === user.id ? a.white : a.black;
                            let b_opponent = b.black.id === user.id ? b.white : b.black;
                            return a_opponent.username.localeCompare(b_opponent.username) || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;

                case '-move-number' :
                case 'move-number' :
                    lst.sort((a, b) => {
                        try {
                            return a.json.moves.length - b.json.moves.length || a.id - b.id;
                        } catch (e) {
                            console.error(a, b, e);
                            return 0;
                        }
                    });
                    break;
            }

            if (this.state.sort_order[0] === '-') {
                lst.reverse();
            }
        }


        if (lst.length === 0) {
            return <div className="container">{this.props.emptyMessage || ""}</div>;
        } else if (lst.length > preferences.get("game-list-threshold")) {
            let sortable = this.props.disableSort ? '' : ' sortable ';
            let sort_order = this.state.sort_order;
            let move_number_sort      = sort_order === 'move-number'    ? 'sorted-desc' : sort_order === '-move-number'    ? 'sorted-asc' : '';
            let game_sort             = sort_order === 'name'           ? 'sorted-desc' : sort_order === '-name'           ? 'sorted-asc' : '';
            let opponent_sort         = sort_order === 'opponent'       ? 'sorted-desc' : sort_order === '-opponent'       ? 'sorted-asc' : '';
            let clock_sort            = sort_order === 'clock'          ? 'sorted-desc' : sort_order === '-clock'          ? 'sorted-asc' : '';
            let opponent_clock_sort   = sort_order === 'opponent-clock' ? 'sorted-desc' : sort_order === '-opponent-clock' ? 'sorted-asc' : '';

            return (
                <div className="GameList GobanLineSummaryContainer">
                    {this.props.opponentStyle
                        ? <div className="GobanLineSummaryContainerHeader">
                              <div onClick={this.sortByMoveNumber} className={sortable + move_number_sort}>{_("Move")}</div>
                              <div onClick={this.sortByName} className={sortable + game_sort + " text-align-left"}>{_("Game")}</div>
                              <div onClick={this.sortByOpponent} className={sortable + opponent_sort + " text-align-left"}>{_("Opponent")}</div>
                              <div onClick={this.sortByClock} className={sortable + clock_sort}>{_("Clock")}</div>
                              <div onClick={this.sortByOpponentClock} className={sortable + opponent_clock_sort}>{_("Opponent's Clock")}</div>
                          </div>
                        : <div className="GobanLineSummaryContainerHeader">
                              <div >{_("Move")}</div>
                              <div >{_("Game")}</div>
                              <div className="text-align-left">{_("Black")}</div>
                              <div></div>
                              <div className="text-align-left">{_("White")}</div>
                              <div></div>
                          </div>
                    }
                    {lst.map((game) =>
                        <GobanLineSummary key={game.id}
                            id={game.id}
                            black={game.black}
                            white={game.white}
                            opponentStyle={this.props.opponentStyle}
                            />)}
                </div>
            );
        } else {
            return (
                <div className="GameList">
                    {lst.map((game) =>
                        <MiniGoban key={game.id}
                            id={game.id}
                            black={game.black}
                            white={game.white}
                            width={game.width}
                            height={game.height}
                            />)}
                </div>
            );
        }
    }
}
