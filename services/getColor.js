import theme from '../theme/theme'
const getRandomColor = () =>{
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    }
export default function getColor(index){
    switch (index){
        case 0:
            return '#fff'
        case 1:
            return theme.colors.bonasoLightAccent
        case 2:
            return theme.colors.bonasoAlternateLight
        case 3:
            return theme.colors.bonasoAlternateUberLight
        case 4:
            return theme.colors.warningBg
        case 5:
            return theme.colors.bonasoUberLightAccent
        case 6:
            return theme.colors.lightGrey
        default:
            return getRandomColor()
    }
}