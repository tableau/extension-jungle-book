let settings = {};

window.tableau = {
    extensions: {
        initializeAsync: async(configure) => {},
        initializeDialogAsync: async() => {
            return 'null'
        },
        ui: {
            displayDialogAsync: async(popurl, payload, options) => {
                return JSON.stringify([{
                    field: 'AnimalGroup',
                    value: 'Lion'
                }]);
            },
            closeDialog: jest.fn()
        },
        settings: {
            set: (name, value) => {
                settings[name] = value;
            },
            getAll: () => {
                return settings
            },
            saveAsync: async() => {}
        },
        environment: {
            mode: ''
        },
        dashboardContent: {
            dashboard: {
                worksheets: [{
                        name: 'Sheet 1',
                        applyFilterAsync: jest.fn().mockResolvedValue('AnimalGroup'),
                        clearFilterAsync: jest.fn().mockResolvedValue('AnimalGroup'),
                        getFiltersAsync: async() => {
                            return [{
                                    filterType: 'categorical',
                                    fieldName: 'AnimalGroup',
                                    getDomainAsync: async() => {
                                        return {
                                            values: [{
                                                    value: 'Cheetah'
                                                },
                                                {
                                                    value: 'Lion'
                                                },
                                                {
                                                    value: 'Monkey'
                                                },
                                                {
                                                    value: 'Ostrich'
                                                },
                                            ]
                                        }
                                    }
                                },
                                {
                                    filterType: 'categorical',
                                    fieldName: 'Zone/Beat',
                                    getDomainAsync: async() => {
                                        return {
                                            values: [{
                                                    value: 'C1'
                                                },
                                                {
                                                    value: 'L1'
                                                },
                                                {
                                                    value: 'M1'
                                                },
                                                {
                                                    value: 'O1'
                                                },
                                            ]
                                        }
                                    }
                                },
                            ];
                        }
                    },
                    {
                        name: 'Sheet 2',
                        applyFilterAsync: jest.fn().mockResolvedValue('AnimalGroup'),
                        clearFilterAsync: jest.fn().mockResolvedValue('AnimalGroup'),
                        getFiltersAsync: async() => {
                            return [{
                                    filterType: 'categorical',
                                    fieldName: 'AnimalGroup',
                                    getDomainAsync: async() => {
                                        return {
                                            values: [{
                                                    value: 'Cheetah'
                                                },
                                                {
                                                    value: 'Lion'
                                                },
                                                {
                                                    value: 'Monkey'
                                                },
                                                {
                                                    value: 'Ostrich'
                                                },
                                            ]
                                        }
                                    }
                                },
                                {
                                    filterType: 'categorical',
                                    fieldName: 'Zone/Beat',
                                    getDomainAsync: async() => {
                                        return {
                                            values: [{
                                                    value: 'C1'
                                                },
                                                {
                                                    value: 'L1'
                                                },
                                                {
                                                    value: 'M1'
                                                },
                                                {
                                                    value: 'O1'
                                                },
                                            ]
                                        }
                                    }
                                },
                            ];
                        }
                    }
                ]
            }
        }
    },
    FilterUpdateType: {
        All: 'all',
        Replace: 'replace'
    }
};