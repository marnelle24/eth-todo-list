App = {
    loading: false,
    contracts: {},

    load: async() => {
        await App.loadWeb3()
        await App.loadAccount()
        await App.loadContract()
        await App.render()
    },

      // https://medium.com/metamask/https-medium-com-metamask-breaking-change-injecting-web3-7722797916a8
    loadWeb3: async () => {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider
            web3 = new Web3(web3.currentProvider)
        } else {
            window.alert("Please connect to Metamask.")
        }
        // Modern dapp browsers...
        if (window.ethereum) {
            window.web3 = new Web3(ethereum)
            try {
                // Request account access if needed
                await ethereum.enable()
                // Acccounts now exposed
                web3.eth.sendTransaction({/* ... */})
            } catch (error) {
                // User denied account access...
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = web3.currentProvider
            window.web3 = new Web3(web3.currentProvider)
            // Acccounts always exposed
            web3.eth.sendTransaction({/* ... */})
        }
        // Non-dapp browsers...
        else {
            console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
        }
    },

    loadAccount: async () => {
        web3.eth.defaultAccount = web3.eth.accounts[0]
        // console.log(App.account)
    },

    loadContract: async () => {
        const todoList = await $.getJSON('TodoList.json')
        App.contracts.TodoList = TruffleContract(todoList)
        App.contracts.TodoList.setProvider(App.web3Provider)

        // hydreate the smart contract with values from the blockchain
        App.todoList = await App.contracts.TodoList.deployed()
    },

    render: async () => {

        if(App.loading) {
            return
        }
        
        //update app loading state
        App.setLoading(true)

        //render account
        $('#account').html(App.account)

        //render task
        await App.renderTasks()

        //update app loading state
        App.setLoading(false)
    },

    renderTasks: async () => {

        // load the total task count from the blockchain
        const taskCount = await App.todoList.taskCount()
        const $taskTemplate = $('.taskTemplate')

        // render out each task with a new task template
        for (let i = 1; i <= taskCount; i++) {
            
            //fetch the taks data from the blockhain
            const task = await App.todoList.tasks(i)
            const taskId = task[0].toNumber()
            const taskContent = task[1]
            const taskCompleted = task[2]

            // create the html of the task
            const $newTaskTemplate = $taskTemplate.clone()
            $newTaskTemplate.find('.content').html(taskContent)
            $newTaskTemplate.find('input')
                            .prop('name', taskId)
                            .prop('checked', taskCompleted)
                            // .on('click', App.toggleCompleted)

            if(taskCompleted) {
                $('#completedTaskList').append($newTaskTemplate)
            } 
            else {
                $('#taskList').append($newTaskTemplate)
            }

             // show the task
            $newTaskTemplate.show()

        }

    },

    setLoading: (boolean) => {
        
        App.loading = boolean
        
        const loader = $('#loader')
        const content = $('#content')

        if(boolean) {
            loader.show()
            content.hide()
        }
        else {
            loader.hide()
            content.show()
        }

    },

    createTask: async () => {
        App.setLoading(true)
        const content = $('#newTask').val()
        await App.todoList.createTask(content)
        window.location.reload()
    }
    

}

$(() => {
    $(window).load(() => {
        App.load()
    })
})