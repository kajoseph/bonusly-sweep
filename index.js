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
    (recipient) => `Nice month, ${recipient.name}. Keep up the great work! #passionate #deliveringexcellence`,
    (recipient) => `Thanks for the quality reviews this month, ${recipient.name}! #teamwork #collaborative`,
    (recipient) => `Thanks for all your hard work this month, ${recipient.name}! #deliveringexcellence #success`,
    (recipient) => `Thanks for all your help this month, ${recipient.name}! #vision #passionate`,
    (recipient) => `Another month in the books. Thanks for being awesome! #success`,
    (recipient) => `Happy ${DaysOfWeek[new Date().getDay()]}! Here's a coffee on me. #teamwork`,
    (recipient) => `Cheers to a great month! Let's make ${MonthsOfYear[new Date().getDate() >= 27 ? new Date().getMonth() + 1 : new Date().getMonth()]} great! #vision #success`,
  ];

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
          const reason = this.reasons[Math.floor(Math.random() * this.reasons.length)](recipient);
          await this.giveBonusToUser(recipient.email, amt, reason);
          totalSent += amt;
          totalReceipts++;
        } catch (e) {
          console.error(`Error sending bonus to ${recipient.email}`, e);
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
