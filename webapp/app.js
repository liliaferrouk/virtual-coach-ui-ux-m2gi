const swiper = new Swiper('.swiper', {
    loop: true,
    slidesPerView: 3.5
});
var donut = $('#donut').donutty({
    min: 0,
    max: 100,
    value: 33,
    color: '#05667B'
});