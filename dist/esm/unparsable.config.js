export default {
    'inter-token': ['BINARY', 'national', 'STORED'],
    'match-token': ['VIRTUAL', 'type = innodb', 'default 0000-00-00 00:00:00', 'default 0000-00-00', 'CONSTRAINT check_active'],
    'func-token': ['GENERATED', 'CHECK', 'PARTITION BY LIST (transaction_type)'],
};
//# sourceMappingURL=unparsable.config.js.map