import csv
import numpy
import slycat.web.server
import StringIO

def parse_file(file):
  rows = [row for row in csv.reader(file.splitlines(), delimiter=",", doublequote=True, escapechar=None, quotechar='"', quoting=csv.QUOTE_MINIMAL, skipinitialspace=True)]
  if len(rows) < 2:
    raise Exception("File must contain at least two rows.")

  attributes = []
  dimensions = [{"name":"row", "type":"int64", "begin":0, "end":len(rows[1:])}]
  data = []
  for column in zip(*rows):
    try:
      data.append(numpy.array(column[1:]).astype("float64", casting='safe'))
      attributes.append({"name":column[0], "type":"float64"})
    except:
      data.append(numpy.array(column[1:]))
      attributes.append({"name":column[0], "type":"string"})

  if len(attributes) < 1:
    raise Exception("File must contain at least one column.")

  return attributes, dimensions, data

def parse(database, model, input, files, aids, **kwargs):
  if len(files) != len(aids):
    raise Exception("Number of files and artifact ids must match.")

  parsed = [parse_file(file) for file in files]

  array_index = int(kwargs.get("array", "0"))
  for (attributes, dimensions, data), aid in zip(parsed, aids):
    slycat.web.server.put_model_arrayset(database, model, aid, input)
    slycat.web.server.put_model_array(database, model, aid, 0, attributes, dimensions)
    slycat.web.server.put_model_arrayset_data(database, model, aid, "%s/.../..." % array_index, data)

def register_slycat_plugin(context):
  context.register_parser("slycat-csv-parser", "Comma separated values (CSV)", ["table"], parse)

