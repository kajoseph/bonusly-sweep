#!/usr/bin/env node

const config = require('./config.json');

const DaysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MonthsOfYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const ONE_MINUTE = 60 * 1000;

class Bonusly {
  apiKey = config.apiKey;
  schedule = config.schedule;
  recipients = config.recipients;

  baseUrl = 'https://bonus.ly/api/v1';
  reasons = [
    () => 'Keep up the good work!',
    () => 'Thanks for the reviews!',
    () => 'Thanks for all your hard work!',
    () => 'Thanks for being awesome!',
    () => 'Great job!',
    () => 'Cheers!',
    () => `Happy ${DaysOfWeek[new Date().getDay()]}!`,
    () => `Happy ${MonthsOfYear[new Date().getDate() >= 27 ? new Date().getMonth() + 1 : new Date().getMonth()]}!`,
  ]
  
  async _doRequest(path, method, body) {
    let res = await fetch(`${this.baseUrl + path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      throw new Error(`Error fetching bonusly API: ${path}. Status: ${res.status} -- ${await res.text()}`);
    }
    const json = await res.json();
    return json.result;
  }

  async getMe() {
    return this._doRequest('/users/me', 'GET');
  }

  async getUserByEmail(email) {
    return (await this._doRequest(`/users?email=${email}`, 'GET'))[0];
  }

  async giveBonusToUser(email, amount, reason) {
    const user = await this.getUserByEmail(email);
    reason = `+${amount} @${user.username} ${reason}`;
    return this._doRequest('/bonuses', 'POST', { reason });
  }

  async executeBonuses() {
    try {
      let totalSent = 0;
      let totalReceipts = 0;
      const me = await this.getMe();
      const amt = Math.floor(me.giving_balance / this.recipients.length);
      if (amt <= 0) {
        console.log('Not enough points to distribute');
        return;
      }
      for (const recipient of this.recipients) {
        try {
          const reason = this.reasons[Math.floor(Math.random() * this.reasons.length)]();
          await this.giveBonusToUser(recipient, amt, reason);
          totalSent += amt;
          totalReceipts++;
        } catch (e) {
          console.error(`Error sending bonus to ${recipient}`, e);
        }
      }
      console.log(`Sent a total of ${totalSent} points to ${totalReceipts} recipients!`);
    } catch (e) {
      console.error('Error executing bonuses', e);
    }
  }

  async runSchedule() {
    while (true) {
      const now = new Date();
      const exDate = this.schedule.dayOfMonth <= 0 ?
        new Date(new Date(new Date(new Date().setMonth(new Date().getMonth() + 1)).setDate(this.schedule.dayOfMonth || -0)).toDateString() + ` ${this.schedule.timeOfDay} EST`) :
        new Date(new Date(new Date().setDate(this.schedule.dayOfMonth)).toDateString() + ` ${this.schedule.timeOfDay} EST`);
      if (now > exDate) {
        await this.executeBonuses();
      } else {
        console.log('Not time to execute bonuses yet. Next time:', exDate);
      }
      await new Promise(resolve => setTimeout(resolve, this.schedule.frequency * ONE_MINUTE));
    }
  }
}

new Bonusly().runSchedule();