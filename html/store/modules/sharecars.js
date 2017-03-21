/**
 * 数据中心
 * 这里包含了几乎所有的网络操作,因为需要token
 * 并且包含了调用公司app用户的token操作
 */
import types from '../ShareCarType'; //数据类型
import "whatwg-fetch";
const _ = require("underscore");
import { Toast } from 'mint-ui';

/** 判断是本地测试还是线上生产环环境 */
const debug = (function() {
	let debug = false;
	let url = window.location.href;
	if (url.slice(0, 5) === "https") {
		debug = false;
	} else {
		debug = true;
	}
	return debug;
})();

/** 如果是app中android */
if (typeof window.jgkj !== "undefined") {
	window.localStorage.setItem("UserInfo", JSON.stringify(window.jgkj.getUserInfo()));
}
/** 如果是ios的app */
// if (typeof window.webkit !== "undefined"&&typeof window.webkit.messageHandlers!=="undefined"&&typeof window.webkit.messageHandlers.getUserInfo!=="undefined") {
// 	window.webkit.messageHandlers.getUserInfo.postMessage(['getData', ]);
// }

/**
 * 从cookie中拿tooken,兼容有些浏览器没有设置cookie
 * @param  {[type]} ) {	let        cookie [description]
 * @return {[type]}   [description]
 */
let Authorization = (function() {
	if (window.localStorage.getItem("UserInfo")) {
		// app中
		let string = window.localStorage.getItem("UserInfo");
		return "Bearer " + JSON.parse(string).Access_Token; //格式为json
	}
	let cookie = document.cookie; //获取浏览器的token
	if (cookie === "") {
		return cookie;
	}

	let arrayCookie = cookie.split(";");

	for (let i = 0; i < arrayCookie.length; i++) {
		let item = arrayCookie[i].split("=");

		if (item[0].trim() === "access_token") {
			return "Bearer " + item[1];
		}
	}

	return ""; //如果没有就返回这个
})();

//检查请求返回的状态
function checkStatus(response) {
	if (response.status >= 200 && response.status < 300) {
		return response
	} else {
		if (response.status === 401) {
			// window.location.href = "https://ticket.samecity.com.cn/api/oauth2/Index?returnUrl=https://ticket.samecity.com.cn/wx/ticket.html";
		}
		Toast({
			message: "服务器繁忙,请稍后重试...",
			position: 'bottom',
			duration: 3000
		});
		// var error = new Error(response.statusText)
		// error.response = response
		// throw error
		return null;
	}
}

// 初始化数据 state
const state = {
	serverUrl: debug ? "http://192.168.31.80" : "", //服务器地址
	Authorization: debug ? "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzODQ1MzM3OTY3NDEiLCJqdGkiOiI4ZTEyMzcwMC1hZGMzLTQ5OTUtODU0Mi01MjIwODZjMjMyOGIiLCJpYXQiOjE0ODk4MDU4NTcsIk1lbWJlciI6Im5vcm1hbCIsIm5iZiI6MTQ4OTgwNTg1NywiZXhwIjoxNDkxMDE1NDU3LCJpc3MiOiJTdXBlckF3ZXNvbWVUb2tlblNlcnZlciIsImF1ZCI6Imh0dHA6Ly9sb2NhbGhvc3Q6MTc4My8ifQ.ESY_j0EAvWpoNRJP0ExHBVKnobeUtZzDn1uCwgar1lg" : Authorization,

	HeaderStatus: false, //默认不显示头部
	showBack: true, //是否显示返回键
	HeaderTitle: "拼车", //头部标题
	showFooter: true, //是否显示底部

	CarInfo: [],
	PeopleInfo: []
}

let postData = (url, data) => {
	return fetch(state.serverUrl + url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: state.Authorization
			},
			body: JSON.stringify(data)
		})
		.then(checkStatus)
		.then(result => result.json())
}

let getData = (url) => {
	return fetch(state.serverUrl + url, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: state.Authorization
			}
		})
		.then(checkStatus)
		.then(result => result.json())
}

// getters,获取数据
// 调用方法如下
// this.$store.getters.getIsFirst
const getters = {
	Development: state => state,
	getHeaderState: state => state.HeaderStatus,
	getFooterState: state => state.showFooter,
	getCarInfo: state => state.CarInfo,
	getPeopleInfo: state => state.PeopleInfo
}

// actions
// 调用方法:
// this.$store.dispatch("cancelOrder",数据)
const actions = {
	/** 设置头部信息数据 */
	setHeaderStatus({ commit, state }, data) {
		commit(types.CHANGE_HEADER, {
			HeaderStatus: data.HeaderStatus ? data.HeaderStatus : state.HeaderStatus,
			showBack: data.showBack ? data.showBack : state.data.showBack,
			HeaderTitle: data.HeaderTitle ? data.HeaderTitle : state.HeaderTitle
		})
	},
	/** 设置底部显示隐藏 */
	setFooterStatus({ commit, state }, data) {
		commit(types.CHANGE_FOOTER, {
			showFooter: data,
		})
	},
	/** 获取车主的列表信息 */
	getCarInfo({ commit, state }, data) {
		return postData("/api/CarPool/ListDre", data)
			.then(result => {
				let data = result.Data;
				commit(types.GET_CAR_INFO, {
					CarInfo: data,
				});
				return data;
			})
	},
	/** 获取乘客信息 */
	getPeopleInfo({ commit, state }, data) {
		return postData("/api/CarPool/ListPassenger", data)
			.then(result => {
				let data = result.Data;
				commit(types.GET_PEOPLE_INFO, {
					PeopleInfo: data,
				})
				return data;
			})
	},
	getTripDetail({ commit, state }, data) {
		return getData("/api/CarPool/GetDre?id=" + data)
	}
}

// mutations
// 改变数据,每一个类型对应一个操作
const mutations = {
	[types.CHANGE_HEADER](state, data) {
		// 设置头部状态显示
		state.HeaderStatus = data.HeaderStatus;
		state.showBack = data.showBack;
		state.HeaderTitle = data.HeaderTitle;
	},
	[types.CHANGE_FOOTER](state, data) {
		state.showFooter = data.showFooter;
	},
	[types.GET_CAR_INFO](state, data) {
		state.CarInfo = data.CarInfo;
	},
	[types.GET_PEOPLE_INFO](state, data) {
		state.PeopleInfo = data.PeopleInfo;
	},
}

export default {
	state,
	getters,
	actions,
	mutations
}