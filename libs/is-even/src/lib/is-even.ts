import _ from 'lodash';
import { format, compareAsc } from 'date-fns';

export function isEven(): any {
  return _.chunk(['a', 'b', 'c', 'd'], 2);
}

format(new Date(2014, 1, 11), 'MM/dd/yyyy');
//=> '02/11/2014'

const dates = [
  new Date(1995, 6, 2),
  new Date(1987, 1, 11),
  new Date(1989, 6, 10),
];

dates.sort(compareAsc);
