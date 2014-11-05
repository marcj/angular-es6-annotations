import {Inject} from '../../annotations';

@Inject('$scope')
export default class MyController {
    constructor($scope) {
        $scope.name = 'MyController';
    }
}