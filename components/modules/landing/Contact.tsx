"use client";

import React, { useState } from "react";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thank you! Your message has been sent to our support team.");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setTopic("");
    setMessage("");
  };

  return (
    <section id="contact" className="py-24 bg-[#F5EEFF]/20 relative">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Side: Form */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-[32px] border border-slate-100 shadow-[0_4px_30px_rgba(196,161,255,0.02)]">
          <div className="text-left mb-8 space-y-2">
            <h3 className="text-[#1D2E54] text-2xl font-black">Drop us a line</h3>
            <p className="text-[#555555] text-sm sm:text-base font-semibold">
              Fill out the form below and we will get back to you shortly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 text-left">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none text-slate-800 text-sm focus:border-[#88CCE1]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Last Name</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none text-slate-800 text-sm focus:border-[#88CCE1]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@email.com"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none text-slate-800 text-sm focus:border-[#88CCE1]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(123) 456-7890"
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none text-slate-800 text-sm focus:border-[#88CCE1]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Topic of Inquiry</label>
              <select
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 outline-none text-slate-800 text-sm bg-white focus:border-[#88CCE1]"
              >
                <option value="" disabled>Select a topic...</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing & Subscriptions</option>
                <option value="general">General Inquiries</option>
                <option value="partnership">Business Partnerships</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help you?"
                className="w-full p-4 rounded-xl border border-gray-200 outline-none text-slate-800 text-sm focus:border-[#88CCE1] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 rounded-xl text-white font-bold transition-all hover:scale-[1.01] active:scale-[0.99] text-sm mt-2"
              style={{ background: "linear-gradient(to right, #99D1E8, #C4A1FF)" }}
            >
              Submit Message
            </button>
          </form>
        </div>

        {/* Right Side: Info Panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#F5EEFF] to-[#FFF0F5] p-8 sm:p-10 rounded-[32px] border border-slate-100 flex flex-col justify-between text-left space-y-8">
          <div className="space-y-4">
            <h3 className="text-[#1D2E54] text-2xl font-black">Get in Touch</h3>
            <p className="text-[#555555] text-sm leading-relaxed font-semibold">
              Have questions about how Parent Bridge works? Our customer care team is here to support your transition.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#88CCE1] border border-slate-100/50 shadow-xs">
                <Phone size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Phone</p>
                <p className="text-sm font-bold text-slate-700">+1 (800) 123-4567</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#C4A1FF] border border-slate-100/50 shadow-xs">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                <p className="text-sm font-bold text-slate-700">support@parentbridge.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#F5B041] border border-slate-100/50 shadow-xs">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Support Hours</p>
                <p className="text-sm font-bold text-slate-700">Mon - Fri: 9:00 AM - 6:00 PM EST</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#F1948A] border border-slate-100/50 shadow-xs">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase">Address</p>
                <p className="text-sm font-bold text-slate-700">123 Peace Way, San Francisco, CA 94103</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/40">
            <p className="text-[11px] text-slate-400 font-bold leading-normal">
              We respond to all email messages within 24 business hours.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
