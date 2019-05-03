$(document.body).on('click', '#logout', function(e) {
    e.preventDefault()
    document.cookie = 'jwt=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.replace("/")
})

$(document.body).on('click', '#add-problem', function() {
    const question = $('#new-question').val()
    const answer = $('#new-answer').val()

    if (question.trim() !== '' && answer.trim() !== '') {

        const html = '<div class="card-body"><div class="form-group"><label for="question">Question</label><textarea class="form-control" id="question" rows="1" name="question">' + question + '</textarea></div><div class="form-group"><label for="answer">Answer</label><textarea class="form-control" id="answer" rows="1" name="answer">' + answer + '</textarea></div><div class="text-center"><button type="button" class="btn btn-primary" id="remove-problem">Remove</button></div></div>'

        $('#problems').append(html)
        $('#new-question').val('')
        $('#new-answer').val('')
    }
})

$(document.body).on('click', '#remove-problem', function(e) {
    $(this).parent().parent().remove()
})

$(document.body).on('click', '#request', function(e) {
    e.preventDefault()
    $.post($(this).attr('href'))
    .then(function(data) {
        location.reload()
    })
})

$(document.body).on('click', '#cancel', function(e) {
    e.preventDefault()
    $.post($(this).attr('href'))
    .then(function(data) {
        location.reload()
    })
})

$(document.body).on('click', '#accept', function(e) {
    e.preventDefault()
    $.post($(this).attr('href'))
    .then(function(data) {
        location.reload()
    })
})

$(document.body).on('click', '#deny', function(e) {
    e.preventDefault()
    $.post($(this).attr('href'))
    .then(function(data) {
        location.reload()
    })
})

$(document.body).on('click', '#unfriend', function(e) {
    e.preventDefault()
    $.post($(this).attr('href')) //unfriend/:userId
    .then(function(data) {
        location.reload()
    })
})

$(document.body).on('click', '#search', function(e) {
    const searchInput = document.getElementById('search-input').value
    $.ajax({
        url: '/dashboard/search',
        method: 'POST',
        data: { username: searchInput }
    })
    .then(function(data) {

        if (data.id !== undefined) {
            
            const html = '<li class="list-group-item d-flex justify-content-between align-items-center"><b>' + data.username + '</b><a href="/dashboard/request/' + data.id + '" id="request"><button type="button" class="btn btn-primary btn-sm">Request</button></a></li>'

            document.getElementById('friend-found').innerHTML = html
        }
    })
    .catch(function (error) {
        console.log(error)
    })
})

$(document.body).on('click', '#delete-guide', function(e) {
    e.preventDefault()
    $.post($(this).attr('href'))
    .then(function(data) {
        location.reload()
    })
})

$(document.body).on('click', '#delete-group', function(e) {
    e.preventDefault()
    $.post($(this).attr('href'))
    .then(function(data) {
        location.reload()
    })
})

$(document.body).on('click', '#delete-session', function(e) {
    e.preventDefault()
    $.post($(this).attr('href'))
    .then(function(data) {
        location.reload()
    })
})