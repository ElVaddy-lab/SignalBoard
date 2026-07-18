# Use an internal activity clock for sample history

The Sample Project Set needs relative historical Activity timestamps while ADR-0001 requires Project changes to generate Activity through database triggers. SignalBoard therefore lets only the hardened transactional sample loader set an internal activity clock consumed by those triggers; ordinary application requests cannot control event time. This adds SQL complexity but preserves one consistent history-generation path and avoids fixed demo dates that become stale.
