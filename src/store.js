/* eslint-disable no-undef, arrow-body-style, no-param-reassign, no-console, camelcase */
import Vue from 'vue';
import Vuex from 'vuex';
import axios from 'axios';

Vue.use(Vuex);

const api =
  (window.location.host === 'doemarina.com.br' || window.location.host === 'test.doemarina.com.br')
    ? 'https://api.votolegal.com.br'
    : 'https://dapi.votolegal.com.br';

export default new Vuex.Store({
  state: {
    paymentStep: 'selectValue',
    amount: 0,
    referral: '',
    token: '',
    donation: {},
    iugu: {},
    messages: [],
    username: {},
    candidate: {},
    donations: [],
    donors: [],
    todayDonations: {
      total_donated: 0,
      people_donated: 0,
    },
    donationsRecent: [],
    donationsRecentCount: 0,
    donationsRecentHasMore: false,
    recentDonation: {},
    address: {},
    paymentData: {},
    hasMoreDonations: false,
    lastDonationMarker: '',
  },
  mutations: {
    SET_PAYMENT_STEP(state, { data }) {
      state.paymentStep = data.step;
    },
    SET_PAYMENT_AMOUNT(state, { data }) {
      state.amount = data.amount;
    },
    SET_TOKEN(state, { token }) {
      state.token = token;
    },
    SET_REFERRAL(state, referral) {
      state.referral = referral;
    },
    SET_USERNAME(state, { user }) {
      state.username = user;
    },
    SET_DONATION(state, { donation }) {
      state.donation = donation;
    },
    SET_IUGU(state, { iugu }) {
      state.iugu = iugu;
    },
    SET_MESSAGES(state, { messages }) {
      state.messages = messages;
    },
    SET_CANDIDATE(state, { res }) {
      state.candidate = res.candidate;
    },
    SET_DONATIONS: (state, payload) => {
      state.hasMoreDonations = payload.has_more || false;
      if (payload.donations.length) { // eslint-disable-next-line
        state.lastDonationMarker = payload.donations[payload.donations.length - 1]._marker;
      }

      state.donations = state.donations.concat(payload.donations);
    },
    SET_DONORS(state, { res }) {
      state.donors = res.names;
    },
    SET_RECENT_DONATION: (state, payload) => {
      state.recentDonation = payload;
    },
    REPLACE_DONATIONS: (state) => {
      const donationsRecent = state.donationsRecent;

      if (donationsRecent.length) {
        state.lastDonationMarker = donationsRecent[donationsRecent.length - 1]._marker; // eslint-disable-line no-underscore-dangle
      }
      state.donations = donationsRecent;
      state.hasMoreDonations = state.donationsRecentHasMore;
      state.donationsRecent = [];
      state.donationsRecentCount = 0;
      state.donationsRecentHasMore = false;
    },
    SET_RECENT_DONATIONS: (state, payload) => {
      const donationToCompare = state.donationsRecent.length === 0 ?
        state.donations[0] :
        state.donationsRecent[0];
      if (donationToCompare) {
        const newDonations = payload.donations;

        if (state.donations.length === 0) {
          state.donationsRecentCount = newDonations.length;
          state.donationsRecent = newDonations;
          state.donationsRecentHasMore = payload.has_more;
        } else {
          let i = 0;

          while (newDonations[i] && newDonations[i]._marker !== donationToCompare._marker) { // eslint-disable-line no-underscore-dangle
            i += 1;
          }

          if (i > 0) {
            state.donationsRecentCount += i;
            state.donationsRecent = newDonations;
            state.donationsRecentHasMore = payload.has_more;
          }
        }
      }
    },
    SET_ADDRESS: (state, payload) => {
      state.address = payload;
    },
    SET_PAYMENT_DATA(state, { paymentData }) {
      state.paymentData = paymentData;
    },
    SET_DONATIONS_TODAY(state, payload) {
      if (state.todayDonations.total_donated !== payload.total_donated_by_votolegal) {
        state.todayDonations.total_donated += payload.total_donated_by_votolegal;
      }

      if (state.todayDonations.people_donated !== payload.count_donated_by_votolegal) {
        state.todayDonations.people_donated += payload.count_donated_by_votolegal;
      }
    },
    SET_DONATIONS_SUMMARY(state, summary) {
      if (state.candidate.total_donated !== summary.total_donated_by_votolegal) {
        state.candidate.total_donated = summary.total_donated_by_votolegal;
      }

      if (state.candidate.people_donated !== summary.count_donated_by_votolegal) {
        state.candidate.people_donated = summary.count_donated_by_votolegal;
      }

      if (state.candidate.raising_goal !== summary.raising_goal) {
        state.candidate.raising_goal = summary.raising_goal;
      }
    },
  },
  actions: {
    CHANGE_PAYMENT_AMOUNT({ commit }, data) {
      commit('SET_PAYMENT_STEP', { data });
      commit('SET_PAYMENT_AMOUNT', { data });
    },
    CHANGE_PAYMENT_STEP({ commit }, data) {
      commit('SET_PAYMENT_STEP', { data });
    },
    SAVE_USERNAME({ commit }, user) {
      commit('SET_USERNAME', { user });
    },
    ADD_TOKEN({ commit }, data) {
      commit('SET_TOKEN', { token: data });
    },
    ADD_REFERRAL({ commit }, data) {
      commit('SET_REFERRAL', data);
    },
    GET_TOKEN({ commit }, data) {
      return new Promise((resolve, reject) => {
        axios({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          url: `${api}/api2/device-authentication`,
          data,
        })
          .then((response) => {
            const { device_authorization_token_id } = response.data;
            commit('SET_TOKEN', { token: device_authorization_token_id });
            resolve(response);
          })
          .catch((err) => {
            console.log('eroooooo', error.response.data);
            console.error(err.response);
            reject(err.response);
          });
      });
    },
    GET_DONATION({ commit }, data) {
      commit('SET_PAYMENT_DATA', { paymentData: data });
      return new Promise((resolve, reject) => {
        axios({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          url: `${api}/api2/donations`,
          data,
        }).then(
          (response) => {
            const { donation, ui } = response.data;
            commit('SET_DONATION', { donation });
            commit('SET_IUGU', { iugu: ui.messages[1] });
            commit('SET_MESSAGES', { messages: response.data.ui.messages });
            resolve();
          },
          (err) => {
            console.error(err.response);
            reject(err.response);
          },
        );
      });
    },
    START_DONATION({ commit, state }, payload) {
      return new Promise((resolve, reject) => {
        axios({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          url: `${api}/api2/donations/${state.donation.id}?device_authorization_token_id=${
            state.token
          }&credit_card_token=${payload.id}&cc_hash=${payload.cc_hash}`,
        }).then(
          (response) => {
            const data = {
              step: 'finalMessage',
            };

            commit('SET_MESSAGES', { messages: response.data.ui.messages });
            commit('SET_PAYMENT_STEP', { data });

            resolve();
          },
          (err) => {
            console.error(err.response);
            reject(err.response);
          },
        );
      });
    },
    GET_CANDIDATE_INFO({ commit }, id) {
      return new Promise((resolve, reject) => {
        axios.get(`${api}/public-api/candidate-summary/${id}`).then(
          (response) => {
            commit('SET_CANDIDATE', { res: response.data });
            resolve();
          },
          (err) => {
            reject(err.response);
            console.error(err);
          },
        );
      });
    },
    GET_DONATIONS({ commit, state }, id) {
      return new Promise((resolve) => {
        axios.get(`${api}/public-api/candidate-donations/${id}/${state.lastDonationMarker}`)
          .then((response) => {
            resolve(response.data.donations);
            commit('SET_DONATIONS', response.data);
          });
      });
    },
    GetDonorsNames({ commit }, id) {
      return new Promise((resolve, reject) => {
        axios.get(`${api}/public-api/candidate-donations/${id}/donators-name`).then(
          (response) => {
            commit('SET_DONORS', { res: response.data });
            resolve();
          },
          (err) => {
            reject(err.response);
            console.error(err);
          },
        );
      });
    },
    REFRESH_DONATIONS({ commit }) {
      commit('REPLACE_DONATIONS');
    },
    UPDATE_DONATIONS({
      commit,
    }, id) {
      setInterval(() => {
        return new Promise((resolve) => {
          axios.get(`${api}/public-api/candidate-donations/${id}`)
            .then((response) => {
              resolve(response.data.donations);
              commit('SET_RECENT_DONATIONS', response.data);
            });
        });
      }, 1000 * 10);
    },
    UPDATE_DONATIONS_SUMMARY({
      commit,
    }, id) {
      setInterval(() => {
        return new Promise((resolve, reject) => {
          axios.get(`${api}/public-api/candidate-donations-summary/${id}`).then(
            (response) => {
              commit('SET_DONATIONS_SUMMARY', response.data.candidate);
              commit('SET_DONATIONS_TODAY', response.data.today);
              if (response.data.recent_donation) {
                commit('SET_RECENT_DONATION', response.data.recent_donation);
              }
              resolve();
            },
            (err) => {
              reject(err.response);
              console.error(err);
            },
          );
        });
      }, 1000 * 60);
    },
    GET_ADDRESS: ({ commit }, cep) => {
      return new Promise((resolve, reject) => {
        axios
          .get(`${api}/api/cep?cep=${cep}`)
          .then((response) => {
            resolve(response.data);
            commit('SET_ADDRESS', response.data);
          })
          .catch((erro) => {
            reject(erro);
          });
      });
    },
    START_DONATION_BOLETO({ commit }, payload) {
      let token = '';
      if (window.localStorage) {
        const tokenName = (window.location.host === 'doemarina.com.br' || window.location.host === 'test.doemarina.com.br')
          ? 'prod_apm_token'
          : 'dev_apm_token';
        token = localStorage.getItem(tokenName);
      }

      return new Promise((resolve, reject) => {
        axios({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          url: `${api}/api2/donations/${payload.donationId}?device_authorization_token_id=${token}`,
        }).then((response) => {
          const data = {
            step: 'printBoleto',
          };
          const { donation, ui } = response.data;
          commit('SET_DONATION', { donation });
          commit('SET_MESSAGES', {
            messages: ui,
          });
          commit('SET_PAYMENT_STEP', {
            data,
          });
          resolve(response);
        }, (error) => {
          commit('SET_MESSAGES', {
            messages: {
              messages: [{
                text: error.response.data[0].message,
              }],
            },
          });

          console.error(error.response);
          reject(error.response);
        });
      });
    },
  },
  getters: {
    generateCandidateObject: (state) => {
      const candidateMerge = {
        donations: state.donations,
      };
      return candidateMerge;
    },
  },
});
